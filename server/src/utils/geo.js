'use strict';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Put missing coordinates at the end
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Basic Nearest Neighbor optimization for a set of points (orders).
 * 
 * @param {Object} startPoint - { latitude, longitude }
 * @param {Array} points - Array of objects with { id, latitude, longitude, ... }
 * @returns {Array} - The sorted array in order of optimal visitation
 */
function optimizeRouteNearestNeighbor(startPoint, points) {
  if (!points || points.length === 0) return [];

  const unvisited = [...points];
  const route = [];
  let currentLoc = startPoint;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistanceFromLatLonInKm(
        currentLoc.latitude, currentLoc.longitude,
        unvisited[i].latitude, unvisited[i].longitude
      );

      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIdx = i;
      }
    }

    // Move to the nearest point
    const nearestPoint = unvisited[nearestIdx];
    route.push(nearestPoint);
    currentLoc = nearestPoint;
    
    // Remove from unvisited list
    unvisited.splice(nearestIdx, 1);
  }

  return route;
}

module.exports = {
  getDistanceFromLatLonInKm,
  optimizeRouteNearestNeighbor
};
