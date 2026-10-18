import {handleReadings} from '../../server/readings.mjs';
export function onRequest({request}){return handleReadings(request);}
