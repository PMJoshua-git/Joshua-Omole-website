import Airtable from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

const base = apiKey && baseId ? new Airtable({ apiKey }).base(baseId) : null;

export const leadsTable = base ? base('Leads') : null;
export const resourcesTable = base ? base('Resource Downloads') : null;
export const resourceLibraryTable = base ? base('Resources Library') : null;
export const trainingSessionsTable = base ? base('Training Sessions') : null;
export const trainingPipelineTable = base ? base('Training Pipeline') : null;

export default base;
