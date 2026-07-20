import Airtable from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

const base = apiKey && baseId ? new Airtable({ apiKey }).base(baseId) : null;

export const leadsTable = base && process.env.AIRTABLE_LEADS_TABLE ? base(process.env.AIRTABLE_LEADS_TABLE) : null;
export const resourcesTable = base && process.env.AIRTABLE_RESOURCE_TABLE ? base(process.env.AIRTABLE_RESOURCE_TABLE) : null;
export const resourceLibraryTable = base && process.env.AIRTABLE_RESOURCE_LIBRARY_TABLE ? base(process.env.AIRTABLE_RESOURCE_LIBRARY_TABLE) : null;
export const trainingSessionsTable = base ? base('Training Sessions') : null;
export const trainingPipelineTable = base ? base('Training Pipeline') : null;

export default base;
