import { SolarSettings, Wall, Room, Point } from '../types';

export interface SolarPosition {
  altitude: number; // in degrees above horizon (0 to 90)
  azimuth: number; // in degrees from True North (0 to 360, 90=East, 180=South, 270=West)
  isDaylight: boolean;
  shadowLengthRatio: number; // tan(90 - altitude)
  shadowDx: number; // unit vector x for shadow
  shadowDy: number; // unit vector y for shadow
}

/**
 * Calculates solar altitude and azimuth based on latitude, season, and time of day.
 */
export function calculateSolarPosition(settings: SolarSettings): SolarPosition {
  const { latitude, season, timeOfDay, northAngle } = settings;

  // Solar declination in degrees
  let declination = 0; // equinox
  if (season === 'summer') {
    declination = 23.45;
  } else if (season === 'winter') {
    declination = -23.45;
  }

  // Convert to radians
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;

  // Hour angle: 12:00 PM is 0 degrees, 15 degrees per hour
  const hourAngle = (timeOfDay - 12) * 15;
  const hRad = (hourAngle * Math.PI) / 180;

  // Solar Altitude (sin(alpha) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(h))
  const sinAlpha = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
  const alphaRad = Math.asin(Math.max(-1, Math.min(1, sinAlpha)));
  const altitude = (alphaRad * 180) / Math.PI;

  const isDaylight = altitude > 0.5;

  // Solar Azimuth (cos(gamma) = (sin(dec) - sin(lat)*sin(alpha)) / (cos(lat)*cos(alpha)))
  let azimuth = 180;
  if (isDaylight) {
    const cosAlpha = Math.cos(alphaRad);
    const cosLat = Math.cos(latRad);
    if (Math.abs(cosLat * cosAlpha) > 1e-5) {
      const cosGamma = (Math.sin(decRad) - Math.sin(latRad) * sinAlpha) / (cosLat * cosAlpha);
      const clamped = Math.max(-1, Math.min(1, cosGamma));
      const gammaRad = Math.acos(clamped);
      const rawAzimuth = (gammaRad * 180) / Math.PI;

      // In northern hemisphere, morning is east (azimuth < 180), afternoon is west (azimuth > 180)
      if (hourAngle < 0) {
        azimuth = rawAzimuth;
      } else {
        azimuth = 360 - rawAzimuth;
      }
    }
  }

  // Adjust for Project North orientation
  // northAngle: 0 = True North is up, 90 = True North is right, etc.
  const relativeAzimuth = (azimuth - northAngle + 360) % 360;
  const relAzimuthRad = (relativeAzimuth * Math.PI) / 180;

  // Shadow direction is opposite to sun direction
  // Sun comes from angle `relativeAzimuth` (0=North/top, 90=East/right, 180=South/bottom, 270=West/left)
  // Shadow points in opposite direction:
  const shadowAngleRad = relAzimuthRad + Math.PI;
  const shadowDx = Math.sin(shadowAngleRad);
  const shadowDy = -Math.cos(shadowAngleRad);

  const shadowLengthRatio = isDaylight ? 1 / Math.tan(Math.max(0.1, alphaRad)) : 0;

  return {
    altitude: Math.max(0, altitude),
    azimuth,
    isDaylight,
    shadowLengthRatio: Math.min(shadowLengthRatio, 4.0), // clamp maximum shadow stretch
    shadowDx,
    shadowDy,
  };
}

export interface RoomSunExposure {
  roomId: string;
  roomName: string;
  exposureRating: 'Morning Sun' | 'Midday Bright' | 'Afternoon Sun' | 'Indirect Skylight' | 'Shaded';
  description: string;
}

/**
 * Evaluates room sunlight exposure based on room orientation and solar parameters.
 */
export function evaluateRoomsSunlight(rooms: Room[], settings: SolarSettings): RoomSunExposure[] {
  const solar = calculateSolarPosition(settings);
  if (rooms.length === 0) return [];

  // Find center of all rooms
  const avgX = rooms.reduce((acc, r) => acc + (r.x + r.width / 2), 0) / rooms.length;
  const avgY = rooms.reduce((acc, r) => acc + (r.y + r.depth / 2), 0) / rooms.length;

  return rooms.map((room) => {
    const rx = room.x + room.width / 2;
    const ry = room.y + room.depth / 2;
    const dx = rx - avgX;
    const dy = ry - avgY;

    // Relative angle from center (0=North, 90=East, 180=South, 270=West)
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    // Apply North rotation
    const trueAngle = (angle + settings.northAngle) % 360;

    let rating: RoomSunExposure['exposureRating'] = 'Indirect Skylight';
    let description = 'Diffused daylight through indirect lighting.';

    if (trueAngle >= 45 && trueAngle < 135) {
      rating = 'Morning Sun';
      description = 'East-facing exposure with warm, glare-free morning sunlight.';
    } else if (trueAngle >= 135 && trueAngle < 225) {
      rating = 'Midday Bright';
      description = 'Direct high-elevation southern sun with maximum solar heat gain.';
    } else if (trueAngle >= 225 && trueAngle < 315) {
      rating = 'Afternoon Sun';
      description = 'Golden afternoon and evening sun; potential summer heat accumulation.';
    } else {
      rating = 'Shaded';
      description = 'Cool northern exposure, ideal for studios, bathrooms, and utility spaces.';
    }

    return {
      roomId: room.id,
      roomName: room.name,
      exposureRating: rating,
      description,
    };
  });
}
