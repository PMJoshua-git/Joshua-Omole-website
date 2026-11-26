import {
  auditResourceRegistrySeo,
  getPublicResources,
  resources,
} from '../server/resources/registry.ts';

function main() {
  const publicResources = getPublicResources(resources);
  const publishedCount = resources.filter((r) => r.status === 'published').length;
  const comingSoonCount = resources.filter((r) => r.status === 'coming-soon').length;
  const draftCount = resources.filter((r) => r.status === 'draft').length;

  console.log(
    `[validate:resources] Total entries: ${resources.length} (published: ${publishedCount}, coming-soon: ${comingSoonCount}, draft: ${draftCount}, public: ${publicResources.length})`
  );

  const report = auditResourceRegistrySeo(resources);
  if (report.warnings.length === 0) {
    console.log(
      `[validate:resources] Checked ${report.checkedCount} non-draft resources. Zero SEO or metadata warnings.`
    );
  } else {
    console.warn(
      `[validate:resources] Found ${report.warnings.length} SEO recommendation warning(s):`
    );
    for (const warning of report.warnings) {
      console.warn(`  - ${warning}`);
    }
  }
}

main();
