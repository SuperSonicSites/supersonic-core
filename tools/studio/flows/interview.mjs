// Init interview flow: walks the new-site-init first-round interview (plus the
// Redesign Branch) as clack prompts mapped 1:1 to data/site-intake.schema.json,
// pre-filling defaults from the existing data/site-intake.json so a re-run is
// an edit, then schema-validates (fail closed) before writing.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { take } from '../lib/ui.mjs';
import { checkAgainstSchema } from '../lib/schema-lite.mjs';

const INTAKE_PATH = 'data/site-intake.json';
const SCHEMA_PATH = 'data/site-intake.schema.json';

const MEMORY_DOCS = [
  'SITE.md',
  'BRAND.md',
  'DESIGN_SYSTEM.md',
  'docs/design-tokens-standard.md',
  'PAGE_MAP.md',
  'CONTENT_MODEL.md',
  'SEO_STRATEGY.md',
  'SECURITY.md',
  'QA_CHECKLIST.md',
  'DEPLOY_CHECKLIST.md'
];

const clean = (value) => String(value === undefined || value === null ? '' : value).trim();
const toList = (value) =>
  clean(value) === ''
    ? []
    : clean(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
const fromList = (list) => (Array.isArray(list) ? list.join(', ') : '');
// TBD placeholders are not useful prefills.
const prefill = (value) => {
  const text = clean(value);
  return text === '' || text.toUpperCase() === 'TBD' ? undefined : text;
};

async function askText(message, { initial, placeholder, required = false, validate } = {}) {
  return clean(
    take(
      await p.text({
        message,
        initialValue: initial,
        placeholder,
        validate: (value) => {
          if (required && clean(value) === '') {
            return 'Required.';
          }
          return validate ? validate(clean(value)) : undefined;
        }
      })
    )
  );
}

// Comma-separated text input -> string array.
async function askList(message, { initial, placeholder = 'comma-separated, blank for none', required = false } = {}) {
  return toList(
    take(
      await p.text({
        message: `${message} ${pc.dim('(comma-separated)')}`,
        initialValue: fromList(initial) || undefined,
        placeholder,
        validate: (value) => (required && toList(value).length === 0 ? 'List at least one item.' : undefined)
      })
    )
  );
}

async function askConfirm(message, initialValue) {
  return take(await p.confirm({ message, initialValue: initialValue !== false }));
}

const slugValidate = (value) =>
  value === '' || value.startsWith('/') ? undefined : 'Slug must be a site-relative path starting with "/".';

async function askPages(existingPages) {
  const pages = [];
  let index = 0;
  let again = true;
  while (again) {
    const prior = existingPages[index] || {};
    p.log.step(`Page ${index + 1}`);
    const title = await askText('Page title', { initial: prefill(prior.title), required: true, placeholder: 'Home' });
    const slug = await askText('Slug (site-relative path)', {
      initial: prefill(prior.slug),
      placeholder: '/',
      required: true,
      validate: slugValidate
    });
    const purpose = await askText('Purpose (one line)', { initial: prefill(prior.purpose), required: true });
    const primaryCta = await askText('Primary CTA', { initial: prefill(prior.primaryCta), required: true });
    const launchRequired = await askConfirm('Required for launch?', prior.launchRequired !== false);
    pages.push({ title, slug, purpose, primaryCta, launchRequired });
    index += 1;
    again = await askConfirm('Add another page?', index < existingPages.length);
  }
  return pages;
}

async function askKnownTopPages(existingTopPages) {
  const topPages = [];
  let index = 0;
  let again = await askConfirm('Add known top legacy pages (from analytics / Search Console)?', existingTopPages.length > 0);
  while (again) {
    const prior = existingTopPages[index] || {};
    p.log.step(`Top legacy page ${index + 1}`);
    const url = await askText('Legacy URL or path', { initial: prefill(prior.url), required: true, placeholder: '/services/' });
    const sessionsText = await askText('Monthly sessions (blank if unknown)', {
      initial: typeof prior.monthlySessions === 'number' ? String(prior.monthlySessions) : undefined,
      validate: (value) => (value !== '' && Number.isNaN(Number(value)) ? 'Enter a number or leave blank.' : undefined)
    });
    const rankingKeywords = await askList('Ranking keywords it carries', { initial: prior.rankingKeywords });
    const topPage = { url };
    if (sessionsText !== '') {
      topPage.monthlySessions = Number(sessionsText);
    }
    if (rankingKeywords.length > 0) {
      topPage.rankingKeywords = rankingKeywords;
    }
    topPages.push(topPage);
    index += 1;
    again = await askConfirm('Add another top legacy page?', index < existingTopPages.length);
  }
  return topPages;
}

async function askLegacySite(existing) {
  const prior = existing && typeof existing === 'object' ? existing : {};
  const isRedesign = await askConfirm(
    'Is this a REDESIGN replacing an existing live website?',
    prior.isRedesign === true
  );
  if (!isRedesign) {
    return { isRedesign: false };
  }
  p.log.step('Redesign Branch (new-site-init): legacy site facts');
  const legacySite = { isRedesign: true };
  legacySite.url = await askText('Legacy site root URL', {
    initial: prefill(prior.url),
    required: true,
    placeholder: 'https://www.example.com',
    validate: (value) => (/^https?:\/\//i.test(value) ? undefined : 'Enter a full http(s) URL.')
  });
  const cms = await askText('Legacy CMS / platform', { initial: prefill(prior.cms), placeholder: 'WordPress, Wix, static HTML...' });
  if (cms !== '') {
    legacySite.cms = cms;
  }
  legacySite.captureDir = clean(prior.captureDir) || 'captured';
  legacySite.keepUrls = await askList('Legacy URLs that must keep their rankings (keepUrls)', { initial: prior.keepUrls });
  legacySite.knownTopPages = await askKnownTopPages(Array.isArray(prior.knownTopPages) ? prior.knownTopPages : []);
  legacySite.assetsToReuse = await askList('Legacy assets to reuse (logos, photos, testimonials, copy, documents)', {
    initial: prior.assetsToReuse
  });
  legacySite.thingsThatMustNotBreak = await askList(
    'What must NOT break after launch (URLs, forms, integrations, embeds, phone links)',
    { initial: prior.thingsThatMustNotBreak }
  );
  return legacySite;
}

async function askBrandAssets(existingAssets) {
  const prior = existingAssets && typeof existingAssets === 'object' ? existingAssets : {};
  const wantAssets = await askConfirm(
    'Record existing brand asset files (logos, favicon)?',
    Object.keys(prior).length > 0
  );
  if (!wantAssets) {
    return undefined;
  }
  const assets = {};
  const logoPaths = await askList('Logo file paths (repo- or capture-relative)', { initial: prior.logoPaths });
  if (logoPaths.length > 0) {
    assets.logoPaths = logoPaths;
  }
  const faviconPath = await askText('Favicon path (blank for none)', { initial: prefill(prior.faviconPath) });
  if (faviconPath !== '') {
    assets.faviconPath = faviconPath;
  }
  const notes = await askText('Brand asset notes (blank for none)', { initial: prefill(prior.notes) });
  if (notes !== '') {
    assets.notes = notes;
  }
  return Object.keys(assets).length > 0 ? assets : undefined;
}

function summarizeChanges(previous, nextIntake) {
  const prior = previous && typeof previous === 'object' ? previous : {};
  const lines = [];
  for (const key of Object.keys(nextIntake)) {
    if (key === '$schema') {
      continue;
    }
    const before = JSON.stringify(prior[key]);
    const after = JSON.stringify(nextIntake[key]);
    if (before === after) {
      lines.push(`  ${key}: unchanged`);
    } else if (before === undefined) {
      lines.push(pc.green(`+ ${key}: added`));
    } else {
      lines.push(pc.yellow(`~ ${key}: updated`));
    }
  }
  return lines;
}

export async function interviewFlow({ rootDir }) {
  p.log.step('Init interview — writes data/site-intake.json (schema-validated)');

  let schema;
  try {
    schema = JSON.parse(await readFile(path.join(rootDir, SCHEMA_PATH), 'utf8'));
  } catch (error) {
    p.log.error(`Cannot read ${SCHEMA_PATH}: ${error.message} — refusing to interview without the schema (fail closed).`);
    return;
  }

  let existing = null;
  try {
    existing = JSON.parse(await readFile(path.join(rootDir, INTAKE_PATH), 'utf8'));
    p.log.info(`Existing ${INTAKE_PATH} loaded — answers below are pre-filled for editing.`);
  } catch {
    existing = null;
  }
  const prior = (key, fallback = {}) =>
    existing && typeof existing === 'object' && existing[key] && typeof existing[key] === 'object'
      ? existing[key]
      : fallback;

  // 1. Client / business
  p.log.step('1/12 Client & business');
  const priorClient = prior('client');
  const client = {
    name: await askText('Business name', { initial: prefill(priorClient.name), required: true }),
    businessType: await askText('Business type', { initial: prefill(priorClient.businessType), required: true }),
    locationOrServiceArea: await askText('Location / service area', {
      initial: prefill(priorClient.locationOrServiceArea),
      required: true
    }),
    primaryOffer: await askText('Primary offer', { initial: prefill(priorClient.primaryOffer), required: true })
  };

  // 2. Goals
  p.log.step('2/12 Website goals');
  const priorGoals = prior('goals');
  const goals = {
    primaryConversion: await askText('Primary conversion goal', { initial: prefill(priorGoals.primaryConversion), required: true }),
    secondaryConversions: await askList('Secondary conversions', { initial: priorGoals.secondaryConversions })
  };

  // 3. Audience
  p.log.step('3/12 Target audience');
  const priorAudience = prior('audience');
  const audience = {
    primaryAudience: await askText('Primary audience', { initial: prefill(priorAudience.primaryAudience), required: true }),
    problems: await askList('Problems they want solved', { initial: priorAudience.problems }),
    decisionTriggers: await askList('Decision triggers', { initial: priorAudience.decisionTriggers })
  };

  // 4. Brand voice
  p.log.step('4/12 Brand voice');
  const priorBrand = prior('brand');
  const brand = {
    voice: await askList('Voice adjectives (professional, warm, premium, direct...)', { initial: priorBrand.voice }),
    writingStyle: await askText('Writing style (one line)', { initial: prefill(priorBrand.writingStyle), required: true }),
    phrasesToAvoid: await askList('Phrases to avoid', { initial: priorBrand.phrasesToAvoid })
  };
  const assets = await askBrandAssets(priorBrand.assets);
  if (assets) {
    brand.assets = assets;
  }

  // 5. Design direction
  p.log.step('5/12 Design direction');
  const priorDesign = prior('design');
  const design = {
    direction: await askText('Design direction (one line)', { initial: prefill(priorDesign.direction), required: true }),
    colors: await askList('Brand colors (hex values)', { initial: priorDesign.colors, placeholder: '#0f172a, #38bdf8' }),
    fonts: await askList('Brand fonts', { initial: priorDesign.fonts }),
    referenceSites: await askList('Reference sites to follow', { initial: priorDesign.referenceSites }),
    avoid: await askList('Design things to avoid', { initial: priorDesign.avoid })
  };

  // 6. Pages
  p.log.step('6/12 Required pages');
  const pages = await askPages(Array.isArray(existing && existing.pages) ? existing.pages : []);

  // 7. SEO
  p.log.step('7/12 SEO priorities');
  const priorSeo = prior('seo');
  const seo = {
    primaryTopics: await askList('Primary topics / services', { initial: priorSeo.primaryTopics, required: true }),
    locations: await askList('Target locations', { initial: priorSeo.locations }),
    competitors: await askList('Main online competitors (domains)', { initial: priorSeo.competitors }),
    schemaOpportunities: await askList('Schema opportunities (Organization, Service, FAQ...)', {
      initial: priorSeo.schemaOpportunities
    })
  };

  // 8. Content model
  p.log.step('8/12 Content model');
  const priorContent = prior('contentModel');
  const contentModel = {
    nativePagesPostsEnough: await askConfirm('Are native pages/posts enough?', priorContent.nativePagesPostsEnough !== false),
    structuredContentTypes: await askList('Structured content types needed (services, testimonials, FAQs...)', {
      initial: priorContent.structuredContentTypes
    })
  };

  // 9. Integrations
  p.log.step('9/12 Forms & integrations');
  const priorIntegrations = prior('integrations');
  const integrations = {
    forms: await askList('Forms needed', { initial: priorIntegrations.forms }),
    booking: await askText('Booking tool (blank for none)', { initial: prefill(priorIntegrations.booking) }),
    crm: await askText('CRM (blank for none)', { initial: prefill(priorIntegrations.crm) }),
    analytics: await askList('Analytics / tracking', { initial: priorIntegrations.analytics }),
    other: await askList('Other integrations', { initial: priorIntegrations.other })
  };

  // 10. Environments
  p.log.step('10/12 Environments');
  const priorEnv = prior('environments');
  const environments = {
    stagingUrl: await askText('Staging URL', {
      initial: prefill(priorEnv.stagingUrl),
      placeholder: 'https://staging.example.com',
      required: true
    }),
    productionUrl: await askText('Production URL (documentation only — production is owner-managed)', {
      initial: prefill(priorEnv.productionUrl),
      required: true
    }),
    rollback: clean(prefill(priorEnv.rollback)) || 'Daily Updraft backups'
  };
  if (!/^https?:\/\/staging\./i.test(environments.stagingUrl)) {
    p.log.warn(
      `Staging URL host does not start with "staging." — live QA page writes through repo tools require a staging.* host (got "${environments.stagingUrl}").`
    );
  }

  // 11. Security
  p.log.step('11/12 Security');
  const priorSecurity = prior('security');
  const security = {
    adminUsers: await askList('Who needs admin access', { initial: priorSecurity.adminUsers }),
    roleNotes: clean(await askText('Role notes', { initial: prefill(priorSecurity.roleNotes) })) || 'Use least-privilege roles.',
    sensitiveWorkflows: await askList('Sensitive workflows (forms, payments, memberships, private content)', {
      initial: priorSecurity.sensitiveWorkflows
    })
  };

  // 12. Launch
  p.log.step('12/12 Launch priorities');
  const priorLaunch = prior('launch');
  const launch = {
    successCriteria: await askText('What makes the first launch successful?', {
      initial: prefill(priorLaunch.successCriteria),
      required: true
    }),
    mustHave: await askList('Must-have for launch', { initial: priorLaunch.mustHave }),
    canWait: await askList('Can wait until after launch', { initial: priorLaunch.canWait })
  };

  const openQuestions = await askList('Open questions (unknowns to resolve later)', {
    initial: existing && Array.isArray(existing.openQuestions) ? existing.openQuestions : []
  });

  // Redesign Branch
  const legacySite = await askLegacySite(existing && existing.legacySite);

  const intake = {
    $schema: './site-intake.schema.json',
    client,
    goals,
    audience,
    brand,
    design,
    pages,
    seo,
    contentModel,
    integrations,
    environments,
    security,
    launch,
    openQuestions,
    legacySite
  };

  // Fail closed: never write an intake the schema rejects.
  const issues = checkAgainstSchema(intake, schema);
  if (issues.length > 0) {
    p.log.error(`The interview produced an intake that FAILS ${SCHEMA_PATH} — nothing was written:`);
    for (const issue of issues) {
      p.log.error(`  ${issue}`);
    }
    return;
  }

  p.note(summarizeChanges(existing, intake).join('\n'), `Changes vs existing ${INTAKE_PATH}`);
  const write = await askConfirm(`Write ${INTAKE_PATH}?`, true);
  if (!write) {
    p.log.warn('Not written — interview answers discarded.');
    return;
  }
  await writeFile(path.join(rootDir, INTAKE_PATH), `${JSON.stringify(intake, null, 2)}\n`);
  p.log.success(`${INTAKE_PATH} written (schema-valid).`);

  p.note(
    [
      'An agent should now regenerate the project memory docs from this intake',
      '(new-site-init Doc Generation Rules):',
      ...MEMORY_DOCS.map((doc) => `  - ${doc}`),
      '',
      legacySite.isRedesign
        ? 'Redesign: next run "Capture legacy site", then "Curate redirects" (hard gate before the build plan).'
        : 'Next: run seo-strategist for SEO research and per-page briefs.'
    ].join('\n'),
    'Next steps'
  );
}
