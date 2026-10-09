import type { Related, Scenario, SourceEngine } from '../shared/types';
import type { RawItem } from './provenance';

/** Demo scenarios. Every claim, outlet, and URL here is fictional. */
export interface DemoScenario extends Scenario {
  items: RawItem[];
  related: Related;
}

function item(
  engine: SourceEngine,
  source: string,
  title: string,
  link: string,
  snippet: string,
  iso: string | null,
  dateRaw: string | null
): RawItem {
  return { engine, source, title, link, snippet, isoDate: iso, dateRaw };
}

const metro: DemoScenario = {
  id: 'metro',
  title: 'A fare rumour that spread in two days',
  claim: 'City metro fares will double from next month',
  blurb: 'Starts on a forum, is picked up by four outlets, then corrected by the authority and a fact checker.',
  related: {
    questions: [
      {
        question: 'Is the city metro fare going to increase next month?',
        snippet: 'The metro authority has opened a consultation on a revision of up to 15 percent. No doubling has been proposed.',
        link: 'https://metrorail.example.gov/notices/fare-consultation',
        source: 'Metro Rail Authority'
      },
      {
        question: 'Who decides metro fares in the city?',
        snippet: 'Fares are set by a fare fixation committee and published as a notice before any change takes effect.',
        link: 'https://metrorail.example.gov/fares',
        source: 'Metro Rail Authority'
      },
      {
        question: 'How can I check an official fare notice?',
        snippet: 'Official notices are published on the authority website under the notices section.',
        link: 'https://metrorail.example.gov/notices',
        source: 'Metro Rail Authority'
      }
    ],
    searches: ['city metro fare revision consultation', 'metro fare chart', 'metro fare hike rumour', 'metro authority notices']
  },
  items: [
    item('google', 'CityCommuter Forum', 'Insiders say city metro fares will double next month', 'https://forum.citycommuter.example.com/threads/metro-fares-double', 'A post on a commuter forum claims the city metro will double fares from next month, citing unnamed insiders.', '2026-09-03T06:30:00Z', 'Sep 3, 2026'),
    item('google_news', 'Sample Daily', 'Report: city metro fares to double from next month, sources claim', 'https://www.sampledaily.example.com/city/metro-fares-double', 'City metro fares are set to double from next month, according to sources quoted in a forum post.', '2026-09-04T04:10:00Z', 'Sep 4, 2026'),
    item('google_news', 'Sample Times', 'Metro fares set to double next month, commuters worried', 'https://www.sampletimes.example.com/news/metro-fares-double-commuters', 'Commuters across the city are worried as metro fares may double from next month.', '2026-09-04T09:45:00Z', 'Sep 4, 2026'),
    item('google_news', 'Sample Herald', 'City metro fares double next month? What we know', 'https://www.sampleherald.example.com/explainer/metro-fares-double', 'An unverified claim says city metro fares will double next month. The authority has not confirmed any change.', '2026-09-05T05:00:00Z', 'Sep 5, 2026'),
    item('google_news', 'Sample Post', 'Commuters react as city metro fares may double next month', 'https://www.samplepost.example.com/local/commuters-react-metro-fares', 'Reactions pour in after reports that city metro fares will double from next month.', '2026-09-05T12:20:00Z', 'Sep 5, 2026'),
    item('google', 'Metro Rail Authority', 'Metro Authority: no plan to double fares, consultation proposes up to 15 percent revision for city metro', 'https://metrorail.example.gov/notices/fare-consultation', 'The city metro authority states there is no proposal to double fares and invites comments on a revision of up to 15 percent.', '2026-09-06T08:00:00Z', 'Sep 6, 2026'),
    item('google_factcheck', 'Sample Fact Check', 'Fact check: city metro fares not doubling next month, authority says', 'https://www.samplefactcheck.example.com/metro-fares-not-doubling', 'The claim that city metro fares will double next month is false. The authority consultation paper proposes a smaller revision.', '2026-09-07T07:15:00Z', 'Sep 7, 2026'),
    item('google_news', 'Sample Wire', 'Metro authority denies fares will double next month', 'https://www.samplewire.example.com/metro-denies-fare-doubling', 'The metro authority denied reports that city fares will double next month and called the claim baseless.', '2026-09-07T10:30:00Z', 'Sep 7, 2026'),
    item('google_scholar', 'Journal of Urban Transport, 2019', 'Fare elasticity and ridership in urban metro systems', 'https://journals.sampleuniversity.example.edu/transport/fare-elasticity', 'Examines how a fare increase in a city metro changes ridership. Doubling fares reduces ridership over the following month.', '2019-01-01T00:00:00Z', '2019'),
    item('google', 'Metro Rail Authority', 'Official city metro fare chart', 'https://metrorail.example.gov/fares', 'Current fare chart for the city metro, by distance and ticket type.', null, null)
  ]
};

const laptops: DemoScenario = {
  id: 'laptops',
  title: 'A scheme claim that outran the ministry',
  claim: 'Free laptops are being distributed to all students this year',
  blurb: 'A viral post, three outlets, then a ministry clarification and a fact check that disagree with the headlines.',
  related: {
    questions: [
      {
        question: 'Which students are eligible for a free laptop?',
        snippet: 'Only students selected through the merit scheme receive a laptop. The scheme is not open to all students.',
        link: 'https://education.example.gov/schemes/merit-laptop',
        source: 'Ministry of Education'
      },
      {
        question: 'How do I apply for the merit laptop scheme?',
        snippet: 'Applications open on the ministry portal after results are announced.',
        link: 'https://education.example.gov/schemes/merit-laptop/apply',
        source: 'Ministry of Education'
      }
    ],
    searches: ['merit laptop scheme eligibility', 'free laptop scheme students apply', 'laptop scheme fake message', 'ministry of education schemes']
  },
  items: [
    item('google', 'EduBuzz Blog', 'Free laptops for all students this year, scheme announced says viral message', 'https://edubuzz.example.com/blog/free-laptops-all-students', 'A viral message says free laptops are being distributed to all students this year under a new scheme.', '2026-09-10T05:00:00Z', 'Sep 10, 2026'),
    item('google_news', 'Sample Daily', 'Free laptops to be distributed to all students this year, report claims', 'https://www.sampledaily.example.com/education/free-laptops-all-students', 'Free laptops are being distributed to all students this year, a report based on a viral message claims.', '2026-09-11T04:30:00Z', 'Sep 11, 2026'),
    item('google_news', 'Sample Times', 'Students await free laptops promised this year', 'https://www.sampletimes.example.com/education/students-await-free-laptops', 'Students across the state await free laptops that are being distributed to all students this year.', '2026-09-11T09:00:00Z', 'Sep 11, 2026'),
    item('google_news', 'Sample Herald', 'Are free laptops really being distributed to all students this year?', 'https://www.sampleherald.example.com/education/free-laptops-really', 'Questions grow over whether free laptops are being distributed to all students this year. Officials were unavailable for comment.', '2026-09-12T06:15:00Z', 'Sep 12, 2026'),
    item('google', 'Ministry of Education', 'Ministry clarification: no scheme to distribute free laptops to all students this year', 'https://education.example.gov/press/laptop-clarification', 'The ministry clarifies that there is no scheme to distribute free laptops to all students this year. The existing merit scheme covers selected students only.', '2026-09-13T08:00:00Z', 'Sep 13, 2026'),
    item('google_factcheck', 'Sample Fact Check', 'Fact check: free laptops for all students this year is a false claim', 'https://www.samplefactcheck.example.com/free-laptops-all-students-false', 'A viral message claiming free laptops are being distributed to all students this year is false, according to the ministry.', '2026-09-14T07:00:00Z', 'Sep 14, 2026'),
    item('google_news', 'Sample Post', 'Ministry denies free laptops for all students this year', 'https://www.samplepost.example.com/education/ministry-denies-free-laptops', 'The ministry denied that free laptops are being distributed to all students this year and called the message misleading.', '2026-09-14T11:40:00Z', 'Sep 14, 2026'),
    item('google_scholar', 'Journal of Education Policy, 2022', 'Evaluating laptop distribution programmes in secondary schools', 'https://journals.sampleuniversity.example.edu/education/laptop-programmes', 'Reviews how free laptops for students are targeted and what outcomes follow in a school year.', '2022-01-01T00:00:00Z', '2022'),
    item('google', 'Ministry of Education', 'Merit laptop scheme: eligibility for students', 'https://education.example.gov/schemes/merit-laptop', 'Eligibility rules for free laptops for students under the merit scheme.', null, null)
  ]
};

const coffee: DemoScenario = {
  id: 'coffee',
  title: 'A study headline that grew in the retelling',
  claim: 'New study says coffee adds ten years to your life',
  blurb: 'A real paper with a modest finding becomes a bold headline. Shows scholarly sources next to news and a university clarification.',
  related: {
    questions: [
      {
        question: 'Does coffee help you live longer?',
        snippet: 'Observational studies find a small association between moderate coffee intake and lower mortality, not a ten year gain.',
        link: 'https://news.sampleuniversity.example.edu/coffee-study-explained',
        source: 'Sample University'
      },
      {
        question: 'Can an observational study prove coffee extends life?',
        snippet: 'Observational studies show association. They cannot prove cause.',
        link: 'https://journals.sampleuniversity.example.edu/nutrition/coffee-mortality',
        source: 'Journal of Nutrition Research'
      }
    ],
    searches: ['coffee mortality cohort study', 'does coffee extend life', 'coffee study headline misleading', 'observational study meaning']
  },
  items: [
    item('google_news', 'Sample Wellness', 'New study says coffee adds ten years to your life', 'https://www.samplewellness.example.com/coffee-adds-ten-years', 'A new study says coffee adds ten years to your life, with drinkers living far longer than others.', '2026-09-20T05:30:00Z', 'Sep 20, 2026'),
    item('google', 'Daily Gulp Blog', 'Study says coffee adds ten years to your life, here is how much to drink', 'https://dailygulp.example.com/blog/coffee-ten-years', 'A new study says coffee adds ten years to your life and shares how many cups to drink.', '2026-09-21T03:00:00Z', 'Sep 21, 2026'),
    item('google_news', 'Sample Daily', 'Drinking coffee could add years to your life, new study finds', 'https://www.sampledaily.example.com/health/coffee-years-life', 'A new study finds coffee could add years to your life. The study followed adults for twelve years.', '2026-09-21T08:20:00Z', 'Sep 21, 2026'),
    item('google_news', 'Sample Times', 'Coffee lovers rejoice: study says ten extra years of life', 'https://www.sampletimes.example.com/lifestyle/coffee-ten-extra-years', 'New study says coffee adds ten years to your life, according to a widely shared summary.', '2026-09-22T06:00:00Z', 'Sep 22, 2026'),
    item('google', 'Sample University Press Office', 'Press office clarifies coffee study does not claim ten added years of life', 'https://news.sampleuniversity.example.edu/coffee-study-clarification', 'The press office clarifies that the new coffee study reports a small association with lower mortality and does not claim coffee adds ten years to life.', '2026-09-23T09:00:00Z', 'Sep 23, 2026'),
    item('google_factcheck', 'Sample Fact Check', 'Fact check: coffee does not add ten years to your life, headline is misleading', 'https://www.samplefactcheck.example.com/coffee-ten-years-misleading', 'Headlines saying a new study shows coffee adds ten years to your life are misleading. The study found a modest association.', '2026-09-25T07:30:00Z', 'Sep 25, 2026'),
    item('google_scholar', 'Journal of Nutrition Research, 2026', 'Coffee consumption and all cause mortality in a twelve year cohort study', 'https://journals.sampleuniversity.example.edu/nutrition/coffee-mortality', 'In a twelve year cohort study, moderate coffee intake was associated with a small reduction in mortality. The new study cannot establish cause.', '2026-01-01T00:00:00Z', '2026'),
    item('google_scholar', 'Annals of Dietary Science, 2021', 'Coffee, life expectancy, and confounding in observational research', 'https://journals.sampleuniversity.example.edu/diet/coffee-confounding', 'Discusses why observational studies of coffee and life expectancy overstate effects on years of life.', '2021-01-01T00:00:00Z', '2021')
  ]
};

export const SCENARIOS: DemoScenario[] = [metro, laptops, coffee];

export function findScenario(id: string | undefined, claim: string): { scenario: DemoScenario; exact: boolean } {
  const byId = SCENARIOS.find((s) => s.id === id);
  if (byId) return { scenario: byId, exact: true };
  const byClaim = SCENARIOS.find((s) => s.claim.toLowerCase() === claim.trim().toLowerCase());
  if (byClaim) return { scenario: byClaim, exact: true };
  return { scenario: SCENARIOS[0], exact: false };
}
