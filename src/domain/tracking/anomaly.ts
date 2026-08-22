export type TrackingPoint = { lat:number; lng:number; at:Date; speedKph?:number };
const R = 6371;
const rad=(v:number)=>v*Math.PI/180;
export function distanceKm(a:TrackingPoint,b:TrackingPoint){const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
export function detectImpossibleMovement(a:TrackingPoint,b:TrackingPoint,maxKph=180){const hours=(b.at.getTime()-a.at.getTime())/3600000;if(hours<=0)return {anomaly:true,reason:'NON_MONOTONIC_TIME'};const implied=distanceKm(a,b)/hours;return {anomaly:implied>maxKph,reason:implied>maxKph?'IMPOSSIBLE_SPEED':null,impliedKph:Math.round(implied)};}
