import { PrismaClient } from '@prisma/client';
import { marked } from 'marked';
import slugify from 'slugify';

const prisma = new PrismaClient();

const estimateReadingMinutes = (markdown: string) => {
  const words = markdown.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 200));
};

interface SeedArticle {
  slug?: string;
  title: string;
  excerpt: string;
  coverUrl: string;
  coverAlt: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  contentMd: string;
  publishedAt: string;
  isFeatured?: boolean;
}

const articles: SeedArticle[] = [
  {
    title: 'Understanding the Mediterranean Diet',
    excerpt: 'Harvard researchers explain why the Mediterranean diet remains the gold standard for heart health and longevity.',
    coverUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Mediterranean diet ingredients on a table',
    sourceName: 'Harvard T.H. Chan School of Public Health',
    sourceUrl: 'https://www.hsph.harvard.edu/nutritionsource/healthy-weight/diet-reviews/mediterranean-diet/',
    tags: ['Nutrition', 'Heart Health', 'Mediterranean'],
    publishedAt: '2024-05-10',
    isFeatured: true,
    contentMd: `# Why the Mediterranean Diet Works

The Mediterranean diet emphasizes vegetables, whole grains, legumes, fruits, nuts, olive oil, and lean proteins. Research shows it reduces risks of heart disease, stroke, and certain cancers.

## Core Principles
- **Plants first**: Vegetables and fruits at every meal.
- **Healthy fats**: Extra-virgin olive oil as the primary fat.
- **Lean proteins**: Fish two to three times weekly; limited red meat.
- **Whole grains**: Brown rice, farro, barley, and oats.
- **Mindful eating**: Shared meals, slower pace, and portion awareness.

## Evidence from Harvard
Long-term cohort studies from Harvard track more than 25,000 adults. Participants in the top quartile of Mediterranean diet adherence have:

- 25% lower risk of cardiovascular events
- 30% lower risk of metabolic syndrome
- Improved cognitive resilience with aging

## Practical Tips
1. Cook with olive oil instead of butter.
2. Choose whole fruits over sugary desserts.
3. Swap refined grains for whole grains.
4. Add legumes to soups and salads twice a week.
5. Use herbs and citrus for flavor rather than salt.

> “It’s not just about single nutrients. The power comes from the pattern.” — Harvard Nutrition Source`,
  },
  {
    title: 'Plant-Based Proteins for Athletes',
    excerpt: 'University of Toronto researchers outline how plant proteins support muscle recovery and performance.',
    coverUrl: 'https://images.unsplash.com/photo-1557152835-0fa3c2e3a4a5?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Athlete preparing a protein bowl',
    sourceName: 'University of Toronto Faculty of Kinesiology',
    sourceUrl: 'https://www.utoronto.ca/news/plant-based-proteins-athletic-performance',
    tags: ['Athletics', 'Plant-Based', 'Protein'],
    publishedAt: '2024-03-22',
    isFeatured: true,
    contentMd: `# Plant Protein and Performance

The University of Toronto compared plant-based and omnivorous athletes across resistance and endurance sports.

## Key Findings
- **Equivalent strength gains** when protein targets (1.6 g/kg) were met.
- **Improved inflammation markers** among plant-strong diets.
- **Better gut microbiome diversity** in plant-focused athletes.

## Protein Sources by Leucine Content
| Food | Serving | Protein | Leucine |
|------|---------|---------|---------|
| Firm tofu | 150 g | 18 g | 1.4 g |
| Lentils | 1 cup cooked | 17 g | 1.3 g |
| Tempeh | 100 g | 19 g | 1.1 g |
| Pea protein | 30 g | 24 g | 2.1 g |
| Edamame | 1 cup | 17 g | 1.0 g |

## Recovery Smoothie Blueprint
1. 30 g pea protein powder
2. 1 ripe banana
3. 1 cup mixed berries
4. 2 cups spinach
5. 1 tbsp almond butter
6. 400 ml soy milk

Blend until creamy. Provides ~35 g protein and critical recovery carbohydrates.`,
  },
  {
    title: 'Sleep and Metabolic Health',
    excerpt: 'Stanford Medicine highlights how consistent sleep schedules influence glucose sensitivity and appetite hormones.',
    coverUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Person sleeping peacefully with morning light',
    sourceName: 'Stanford Medicine',
    sourceUrl: 'https://med.stanford.edu/news/all-news/2024/04/sleep-metabolism.html',
    tags: ['Sleep', 'Metabolism', 'Lifestyle'],
    publishedAt: '2024-04-14',
    contentMd: `# Sleep as a Metabolic Regulator

Stanford researchers followed 812 adults for six months to assess how sleep variability affects metabolic markers.

## Hormonal Shifts
- **Ghrelin** increased 18% after nights < 6 hours.
- **Leptin** decreased 19% with irregular bedtimes.
- **Insulin sensitivity** dropped by 23% after three nights of deficit.

## Restorative Sleep Checklist
1. Target 7.5–8.5 hours nightly.
2. Keep a consistent wake time (±30 minutes).
3. Avoid caffeine after 2 p.m.
4. Dim lights 60 minutes before bed.
5. Limit screens; consider blue-light filters.

> Sleep hygiene is preventive medicine. Aligning circadian rhythms is one of the most accessible interventions for metabolic health.

## Practical Takeaway
Use a weekly log to correlate sleep duration with energy levels and cravings. Small changes compound over time.`,
  },
  {
    title: 'Hydration Strategies for Runners',
    excerpt: 'Penn State outlines evidence-based hydration protocols before, during, and after long-distance events.',
    coverUrl: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Runner hydrating during sunrise',
    sourceName: 'Penn State College of Medicine',
    sourceUrl: 'https://news.psu.edu/story/health/hydration',
    tags: ['Hydration', 'Endurance', 'Performance'],
    publishedAt: '2023-11-08',
    contentMd: `# Hydration Before, During, After Runs

Proper hydration maintains blood plasma volume, thermoregulation, and neuromuscular function.

## Pre-Run
- Drink 6 ml/kg of water two hours before the start.
- Assess urine color (light straw goal).

## During Run (>60 minutes)
- Target 0.4–0.8 liters per hour depending on sweat rate.
- Use electrolyte solutions providing 300–600 mg sodium per hour.
- Sip every 15–20 minutes; avoid large boluses.

## Post-Run Recovery
- Replace 150% of weight lost (1 kg lost = 1.5 liters fluid) over the next 2–4 hours.
- Combine with carbohydrates (1.2 g/kg) for glycogen resynthesis.

## Monitoring Tools
- Morning body mass trends.
- Sweat rate testing in training.
- Wearable hydration monitors (emerging tech).

Hydration is individualized. Runners should calibrate plans during training, not on race day.`,
  },
  {
    title: 'Gut Microbiome and Mental Health',
    excerpt: 'Oxford neuroscientists share how fermented foods and fiber shape the gut-brain axis.',
    coverUrl: 'https://images.unsplash.com/photo-1584265549845-1284ac2db582?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Fermented foods in jars',
    sourceName: 'University of Oxford Department of Psychiatry',
    sourceUrl: 'https://www.psych.ox.ac.uk/news/gut-brain-axis-update',
    tags: ['Mental Health', 'Microbiome', 'Nutrition'],
    publishedAt: '2024-02-01',
    isFeatured: true,
    contentMd: `# The Gut-Brain Axis

Oxford researchers summarize randomized trials on how diet modulates mood via the microbiome.

## Findings
- Fermented foods (kefir, kimchi) reduce anxiety scores by 18%.
- Prebiotic fibers (inulin, GOS) improve emotional regulation in 4 weeks.
- Polyphenols feed gut microbes producing short-chain fatty acids (SCFAs).

## Daily Microbiome Plate
1. Half the plate: colorful vegetables.
2. Quarter: whole grains or resistant starches.
3. Quarter: lean proteins including legumes.
4. Side: fermented food serving.

## Mindful Implementation
- Introduce fibers gradually to avoid bloating.
- Track mood metrics alongside dietary changes.
- Pair nutrition with stress management and sleep hygiene.`
  },
  {
    title: 'Strength Training for Healthy Aging',
    excerpt: 'Mayo Clinic offers a blueprint for preserving muscle mass and bone density after 50.',
    coverUrl: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Older adult lifting weights with trainer',
    sourceName: 'Mayo Clinic Healthy Aging Program',
    sourceUrl: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670',
    tags: ['Strength', 'Healthy Aging', 'Exercise'],
    publishedAt: '2023-09-18',
    contentMd: `# Maintain Strength as You Age

Sarcopenia accelerates after age 50. Mayo Clinic guidelines recommend progressive resistance training twice weekly.

## Program Essentials
- **Frequency**: 2–3 non-consecutive days per week.
- **Exercises**: Multi-joint movements (squats, rows, presses).
- **Intensity**: 60–75% of one-repetition maximum, two sets of 8–12 reps.
- **Balance**: Add single-leg drills and core stability work.

## Nutrition Support
- 25–30 g protein per meal.
- Vitamin D (800–1,000 IU daily) when deficient.
- Creatine monohydrate (3–5 g/day) may assist strength gains.

> Resistance training is medicine for bone, muscle, and mind.

Consult healthcare providers before beginning new exercise programs, especially with chronic conditions.`,
  },
  {
    title: 'Carbohydrate Periodization for Cyclists',
    excerpt: 'University of Colorado Boulder explains how to match carbohydrate intake with training demands.',
    coverUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Cyclists climbing a mountain road',
    sourceName: 'University of Colorado Boulder Applied Sports Lab',
    sourceUrl: 'https://www.colorado.edu/today/2024/01/19/carb-periodization',
    tags: ['Cycling', 'Carbohydrates', 'Performance'],
    publishedAt: '2024-01-19',
    contentMd: `# Match Fuel to Workload

Periodizing carbohydrates helps cyclists optimize glycogen stores, metabolic flexibility, and weight management.

## Training Zones & Carbs
- **Recovery rides**: 3–4 g/kg/day.
- **Endurance days**: 5–7 g/kg/day.
- **High-intensity sessions**: 7–10 g/kg/day.

## Sleep-Low Strategy
1. Evening interval session depletes glycogen.
2. Limited carbs overnight.
3. Fasted low-intensity ride next morning to boost fat oxidation.

Use strategically—no more than twice weekly—and pair with adequate protein to preserve lean mass.

## Practical Meal Ideas
- Oatmeal with berries and almond butter (70 g carbs).
- Quinoa bowl with roasted vegetables and tofu (60 g carbs).
- Whole-grain pasta with tomato lentil sauce (90 g carbs).

Hydration and electrolyte balance remain critical during all training phases.`,
  },
  {
    title: 'Mindful Eating for Stress Management',
    excerpt: 'Yale research demonstrates how mindful eating techniques can lower cortisol and emotional eating.',
    coverUrl: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Person practicing mindful eating with tea',
    sourceName: 'Yale Stress Center',
    sourceUrl: 'https://news.yale.edu/2023/12/05/mindful-eating-stress',
    tags: ['Mindfulness', 'Stress', 'Behavior Change'],
    publishedAt: '2023-12-05',
    contentMd: `# Slow Down to Eat Smarter

Mindful eating programs train attention, awareness, and non-judgment.

## Yale Study Outcomes
Participants practicing mindful eating for 8 weeks:
- Reduced cortisol awakening response by 12%.
- Decreased emotional eating episodes by 28%.
- Improved intuitive eating scores by 21%.

## Daily Five-Minute Practice
1. Take three calming breaths before eating.
2. Observe colors, smells, and textures of food.
3. Chew slowly (aim for 20 chews per bite).
4. Pause halfway to rate hunger and fullness.
5. Express gratitude for the meal.

Mindful eating complements structured nutrition plans by reducing stress triggers that undermine goals.`
  },
  {
    title: 'Desk Mobility Routine for Remote Workers',
    excerpt: 'UC Berkeley ergonomics experts share a quick mobility circuit to counteract long sitting sessions.',
    coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Person stretching at a standing desk',
    sourceName: 'UC Berkeley Ergonomics Program',
    sourceUrl: 'https://uhs.berkeley.edu/news/ergonomics-home',
    tags: ['Mobility', 'Workplace', 'Posture'],
    publishedAt: '2024-03-11',
    contentMd: `# Move Every 50 Minutes

Sedentary behavior contributes to back pain, neck tension, and reduced metabolic health.

## Five-Move Circuit (Repeat Twice)
1. **Thoracic Reach** (10 each side)
2. **Hip Flexor Stretch** (30 sec each)
3. **Chair Squats** (15 reps)
4. **Calf Raises** (20 reps)
5. **Desk Push-Ups** (12 reps)

## Ergonomic Tips
- Monitor at eye level; forearms parallel to floor.
- Feet flat with knees at 90 degrees.
- Use reminder apps for micro-breaks.

Pair movement with hydration cues: stand and stretch every time you refill water.`,
  },
  {
    title: 'Smart Grocery Shopping for Balanced Meals',
    excerpt: 'Cornell nutrition scientists lay out a research-backed grocery strategy to support healthy meal planning.',
    coverUrl: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Person shopping for fresh vegetables',
    sourceName: 'Cornell Division of Nutritional Sciences',
    sourceUrl: 'https://news.cornell.edu/stories/2024/02/grocery-shopping-checklist-health',
    tags: ['Meal Planning', 'Groceries', 'Family Health'],
    publishedAt: '2024-02-18',
    contentMd: `# Build a Smarter Grocery List

Cornell researchers analyzed household purchasing patterns that predict balanced weekly meals.

## The 60/30/10 Cart Formula
- 60% produce (fresh or frozen)
- 30% proteins (legumes, seafood, lean meats, dairy alternatives)
- 10% convenience items and treats

## Label Reading Checklist
1. Ingredients you recognize first.
2. Added sugars < 6 g per serving for daily items.
3. Sodium < 400 mg per serving for pantry staples.
4. Whole grains listed first for breads and cereals.

Plan meals before shopping to reduce impulse buys and food waste.`,
  },
  {
    title: 'Omega-3s and Cognitive Health',
    excerpt: 'University of Washington analyzes how omega-3 fatty acids protect brain structure during aging.',
    coverUrl: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Salmon fillet with herbs and lemon',
    sourceName: 'University of Washington School of Medicine',
    sourceUrl: 'https://newsroom.uw.edu/news/omega-3s-brain-aging',
    tags: ['Brain Health', 'Fats', 'Aging'],
    publishedAt: '2023-10-02',
    contentMd: `# Omega-3s Shield the Brain

Long-chain omega-3 fatty acids (EPA, DHA) integrate into neuronal membranes and influence neuroinflammation.

## Study Insights
- Participants with higher DHA levels had 10% greater hippocampal volume.
- Omega-3 indices correlated with better executive function scores.
- Dietary sources outperformed supplements when consumed twice weekly.

## Food Sources
- Wild salmon, sardines, trout, mackerel.
- Plant sources: flaxseed, chia, walnuts (ALA).

Pair omega-3 intake with resistance training and cognitive puzzles for holistic brain support.`,
  },
  {
    title: 'Nutrition for Bone Density',
    excerpt: 'Columbia University endocrinologists summarize nutrients essential for bone remodeling.',
    coverUrl: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Dairy and leafy greens on a table',
    sourceName: 'Columbia University Irving Medical Center',
    sourceUrl: 'https://www.cuimc.columbia.edu/news/bone-health-nutrition',
    tags: ['Bone Health', 'Calcium', 'Vitamin D'],
    publishedAt: '2024-01-08',
    contentMd: `# Eat to Support Your Bones

Bone is dynamic tissue requiring sufficient nutrient supply.

## Daily Targets
- Calcium: 1,200 mg for adults over 50.
- Vitamin D: 800–1,000 IU when sun exposure is limited.
- Vitamin K2: From fermented foods and leafy greens.
- Magnesium: 320–420 mg for collagen matrix support.

## Sample Day
- Breakfast: Fortified soy yogurt with berries
- Lunch: Kale salad with chickpeas and almonds
- Snack: Sardines on whole-grain toast
- Dinner: Baked tofu with roasted broccoli and quinoa

Weight-bearing exercise and strength training complement nutritional strategies.`,
  },
  {
    title: 'Low-Impact HIIT for Joint Health',
    excerpt: 'University of Sydney physiotherapists validate a low-impact interval protocol safe for older adults.',
    coverUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Older adults exercising in a studio',
    sourceName: 'University of Sydney Faculty of Medicine',
    sourceUrl: 'https://www.sydney.edu.au/news-opinion/news/2023/09/29/low-impact-hiit-joints.html',
    tags: ['HIIT', 'Joint Health', 'Seniors'],
    publishedAt: '2023-09-29',
    contentMd: `# HIIT Without the Impact

A 12-week trial evaluated circuit-based HIIT using rowing machines, elliptical trainers, and bodyweight strength moves.

## Outcomes
- 17% improvement in cardio fitness.
- Significant reduction in joint pain scores.
- Better balance and functional mobility assessments.

## Sample Session (30 minutes)
1. Warm-up: 5 minutes light cardio
2. Circuit x4 rounds:
   - 45 seconds rowing
   - 45 seconds bodyweight squats (or chair sits)
   - 45 seconds push-ups against wall
   - 45 seconds marching step-ups
   - 60 seconds rest
3. Cool down and gentle mobility

Participants monitored rate of perceived exertion (RPE 6–7) and maintained joint-friendly ranges of motion.`,
  },
  {
    title: 'Healthy Lunchboxes for Kids',
    excerpt: 'University of Michigan pediatric dietitians design lunchbox frameworks to keep kids energized.',
    coverUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Colorful lunchbox with vegetables and sandwiches',
    sourceName: 'C.S. Mott Children’s Hospital (University of Michigan)',
    sourceUrl: 'https://www.mottchildren.org/news/healthy-school-lunches',
    tags: ['Kids Nutrition', 'School Lunch', 'Family'],
    publishedAt: '2024-08-30',
    contentMd: `# Build Balanced Lunchboxes

Kids need steady fuel for attention, mood, and activity.

## Lunchbox Formula (4 Compartments)
1. Whole-grain base (wrap, pasta, quinoa)
2. Lean protein (beans, chicken, tofu, yogurt)
3. Colorful produce (2 choices minimum)
4. Crunchy snack or healthy fat (nuts, seeds, popcorn)

## Smart Swaps
- Water or milk instead of sugary drinks.
- Trail mix with dried fruit vs. candy bars.
- Hummus cups for dipping veggies.

Get kids involved in planning and packing to boost acceptance.`,
  },
  {
    title: 'Managing Blood Pressure with DASH',
    excerpt: 'NIH researchers revisit the DASH diet and provide updated portion guides.',
    coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Healthy meal with vegetables and grains',
    sourceName: 'National Heart, Lung, and Blood Institute',
    sourceUrl: 'https://www.nhlbi.nih.gov/health-topics/dash-eating-plan',
    tags: ['DASH', 'Blood Pressure', 'Cardiometabolic'],
    publishedAt: '2024-04-02',
    contentMd: `# DASH Refresher

The Dietary Approaches to Stop Hypertension (DASH) diet emphasizes fruits, vegetables, whole grains, and low-fat dairy.

## Portion Snapshot (2,000 kcal)
- 6 servings whole grains
- 4–5 servings vegetables
- 4–5 servings fruit
- 2–3 servings low-fat dairy or fortified alternatives
- 6 oz or fewer lean meat/poultry/fish
- 4–5 weekly servings legumes, nuts, seeds

## Sodium Targets
- Standard DASH: ≤ 2,300 mg/day
- Lower-sodium DASH: ≤ 1,500 mg/day

Pair DASH with physical activity and stress reduction for greater blood pressure control.`,
  },
  {
    title: 'Intuitive Fueling for Endurance Athletes',
    excerpt: 'Colorado State nutritionists explain how to align hunger cues with training blocks.',
    coverUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Trail runner refueling with snacks',
    sourceName: 'Colorado State University Department of Nutrition',
    sourceUrl: 'https://source.colostate.edu/intuitive-fueling-endurance-athletes',
    tags: ['Endurance', 'Intuitive Eating', 'Fueling'],
    publishedAt: '2023-11-14',
    contentMd: `# Listen to Your Training Hunger

Endurance training increases appetite variability. Intuitive fueling integrates structured fueling plans with hunger awareness.

## The Four-S Framework
1. **Schedule**: Plan snacks around key sessions.
2. **Signals**: Notice hunger, fullness, and cravings.
3. **Satiety**: Include macros that sustain energy.
4. **Self-Compassion**: Fuel without guilt during heavy blocks.

Intuitive fueling prevents under-recovery and supports long-term consistency.`
  },
  {
    title: 'Creative Ways to Increase Daily Fiber',
    excerpt: 'Johns Hopkins dietitians share practical fiber boosts for busy professionals.',
    coverUrl: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'High-fiber foods displayed on a table',
    sourceName: 'Johns Hopkins Medicine',
    sourceUrl: 'https://www.hopkinsmedicine.org/health/wellness-and-prevention/fiber-for-health',
    tags: ['Fiber', 'Digestive Health', 'Meal Prep'],
    publishedAt: '2024-05-01',
    contentMd: `# Add Fiber Without Overhauling Meals

Adults should aim for 25–38 g fiber per day, yet most consume less than 16 g.

## Quick Fiber Upgrades
- Add chia or flax to smoothies (4 g per tablespoon).
- Choose lentil or chickpea pasta (2x fiber vs wheat).
- Swap white rice for farro or barley.
- Snack on pears, raspberries, or air-popped popcorn.

Increase water intake alongside fiber to support digestion.`,
  },
  {
    title: 'Sustainable Weight Management Framework',
    excerpt: 'University of Copenhagen identifies behavioral anchors that predict long-term weight maintenance.',
    coverUrl: 'https://images.unsplash.com/photo-1467453678174-768ec283a940?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Person planning meals at a table',
    sourceName: 'University of Copenhagen Clinical Nutrition',
    sourceUrl: 'https://healthsciences.ku.dk/news/2024/sustainable-weight-management',
    tags: ['Weight Management', 'Behavior Change', 'Lifestyle'],
    publishedAt: '2024-06-06',
    contentMd: `# Behavioral Anchors for Maintenance

Researchers tracked 1,200 adults who maintained ≥5% weight loss for two years.

## Anchors
- Weekly meal planning session.
- Daily step goal (≥8,000 steps).
- 7+ hours of sleep with consistent routine.
- Support network (group chats, coaching, or peer buddy).

> Success is less about strict dieting and more about predictable routines.

Use habit trackers to celebrate consistency, not perfection.`,
  },
  {
    title: 'Balanced Smoothies that Satisfy',
    excerpt: 'University of British Columbia nutritionists craft satiating smoothie templates for busy mornings.',
    coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Healthy smoothie with fruits and greens',
    sourceName: 'University of British Columbia School of Dietetics',
    sourceUrl: 'https://www.ubc.ca/stories/satiating-smoothies',
    tags: ['Smoothies', 'Breakfast', 'Satiety'],
    publishedAt: '2024-03-02',
    contentMd: `# Build a Smoothie That Lasts Until Lunch

Smoothies should balance protein, fiber, and healthy fats.

## The UBC Smoothie Template
1. **Protein**: Greek yogurt, tofu, or protein powder (20 g).
2. **Fiber**: Oats, chia, flax, or psyllium (5–7 g).
3. **Healthy fats**: Nut butter, avocado, hemp seeds (10 g).
4. **Produce**: 2 servings of fruits/vegetables.
5. **Liquid**: Milk or fortified alternative.

Blend and adjust thickness. Optional greens add micronutrients without overpowering flavor.`,
  },
  {
    title: 'Managing PCOS with Nutrition and Movement',
    excerpt: 'Monash University endocrinologists provide an updated lifestyle protocol for PCOS management.',
    coverUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Woman practicing yoga outdoors',
    sourceName: 'Monash University Centre for Endocrinology',
    sourceUrl: 'https://www.monash.edu/medicine/news/pcos-guidelines',
    tags: ['PCOS', 'Hormonal Health', 'Women'],
    publishedAt: '2024-07-15',
    contentMd: `# Lifestyle First for PCOS

Updated PCOS guidelines emphasize nutrition, movement, and stress reduction as first-line therapy.

## Nutrition Focus
- Balanced macronutrients with fiber-rich carbohydrates.
- Emphasize unsaturated fats and lean proteins.
- Limit ultra-processed foods and added sugars.

## Movement
- Mix resistance training (3x/week) with moderate cardio (150 minutes/week).
- Add yoga or pilates for stress management.

Monitor cycle regularity, energy, and mood to fine-tune the plan.`,
  },
  {
    title: 'Reducing Added Sugar Without Feeling Deprived',
    excerpt: 'University of Illinois extension shares realistic strategies to cut added sugars while keeping meals satisfying.',
    coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Assorted fruits and granola bowls',
    sourceName: 'University of Illinois Extension',
    sourceUrl: 'https://extension.illinois.edu/news-releases/reduce-added-sugar',
    tags: ['Sugar', 'Healthy Habits', 'Lifestyle'],
    publishedAt: '2024-05-19',
    contentMd: `# Cut Sugar Strategically

Average adults consume 17 teaspoons of added sugar daily—twice the recommended amount.

## Swap Ideas
- Greek yogurt + fruit compote instead of flavored yogurts.
- Sparkling water with citrus vs. soda.
- Cinnamon and vanilla in coffee instead of syrups.

Track cravings and energy to notice positive shifts.`,
  },
  {
    title: 'Functional Warm-Ups for Strength Sessions',
    excerpt: 'Georgia Tech strength coaches recommend dynamic warm-ups that prime mobility and nervous system readiness.',
    coverUrl: 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Athlete performing dynamic warm-up in gym',
    sourceName: 'Georgia Tech Applied Physiology Lab',
    sourceUrl: 'https://www.gatech.edu/news/dynamic-warmups',
    tags: ['Strength', 'Warm-Up', 'Performance'],
    publishedAt: '2023-10-28',
    contentMd: `# Prime the Body Before Lifting

Dynamic warm-ups improve range of motion, muscle temperature, and neural drive.

## Five-Minute Warm-Up
1. Jump rope or bike (60 seconds)
2. World’s greatest stretch (each side)
3. Glute bridges (15 reps)
4. Inchworm walkouts (8 reps)
5. Lateral lunges (10 each side)

Advanced lifters can add light plyometrics or tempo squats before heavy sets.`,
  },
  {
    title: 'Managing Inflammation with Everyday Foods',
    excerpt: 'Tufts University nutrition scientists rank anti-inflammatory foods that support long-term health.',
    coverUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Colorful anti-inflammatory foods',
    sourceName: 'Tufts Friedman School of Nutrition Science',
    sourceUrl: 'https://nutritionletter.tufts.edu/anti-inflammatory-diet',
    tags: ['Inflammation', 'Superfoods', 'Lifestyle'],
    publishedAt: '2024-02-12',
    contentMd: `# Everyday Anti-Inflammatory Choices

Chronic inflammation underlies many chronic diseases. Diet can modulate inflammatory pathways.

## Top Food Categories
- Berries and cherries (anthocyanins)
- Fatty fish (omega-3s)
- Leafy greens (polyphenols)
- Turmeric and ginger (curcuminoids)
- Nuts and seeds (healthy fats)

Combine anti-inflammatory foods with activity, sleep, and stress management for synergistic benefits.`,
  },
  {
    title: 'Fueling Busy Workdays with Bento Boxes',
    excerpt: 'University of Edinburgh dietetic interns share balanced bento box combinations for professionals.',
    coverUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Colorful bento lunch boxes',
    sourceName: 'University of Edinburgh Nutrition Program',
    sourceUrl: 'https://www.ed.ac.uk/news/2024/bento-box-nutrition',
    tags: ['Meal Prep', 'Workday', 'Energy'],
    publishedAt: '2024-04-25',
    contentMd: `# Bento Blueprint

Bento boxes encourage portion balance and visual appeal.

## Template
- Protein compartment: edamame, salmon, tofu, hard-boiled eggs.
- Grain compartment: sushi rice, quinoa, soba noodles.
- Veggie compartment: pickled cucumbers, steamed broccoli, cherry tomatoes.
- Flavor boosters: seaweed salad, sesame seeds, citrus wedges.

Rotate colors and textures to keep meals exciting.`,
  },
  {
    title: 'Recovery Nutrition After HIIT',
    excerpt: 'Loughborough University sports nutritionists outline post-HIIT fueling to replenish energy and repair muscle.',
    coverUrl: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Athlete refueling with smoothie after workout',
    sourceName: 'Loughborough University Sport Science',
    sourceUrl: 'https://www.lboro.ac.uk/news-events/news/2024/april/hiit-recovery-nutrition/',
    tags: ['HIIT', 'Recovery', 'Nutrition'],
    publishedAt: '2024-04-09',
    contentMd: `# Post-HIIT Fuel Checklist

HIIT depletes glycogen and triggers muscle protein breakdown.

## 30-Minute Window
- Carbohydrates: 1.0–1.2 g/kg
- Protein: 0.3 g/kg high-quality source
- Fluids: 150% of weight lost
- Electrolytes: 500–700 mg sodium when sweat losses high

Pair nutrition with light stretching and sleep to cement adaptations.`,
  },
  {
    title: 'Healthy Family Dinners in 30 Minutes',
    excerpt: 'University of Minnesota extension shares quick dinner frameworks families actually enjoy.',
    coverUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Family preparing dinner together',
    sourceName: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/news/30-minute-family-meals',
    tags: ['Family Meals', 'Time-Saving', 'Budget'],
    publishedAt: '2024-06-18',
    contentMd: `# Dinner Frameworks that Work

## Sheet Pan Suppers
- Protein: chicken thighs, tofu, or shrimp
- Veggies: broccoli, bell peppers, cauliflower
- Starch: diced sweet potatoes
- Seasoning: olive oil, garlic, smoked paprika

Bake at 400°F (205°C) for 20–25 minutes, stirring once.

## Pasta Toss
- Whole-grain or legume pasta
- Frozen vegetables (thawed)
- White beans or rotisserie chicken
- Sauce: pesto, tomato basil, or lemon olive oil

Top with herbs and grated parmesan.`,
  },
  {
    title: 'Mindset Tools for Injury Recovery',
    excerpt: 'USC sports psychologists discuss mental skills that accelerate athletic injury rehab.',
    coverUrl: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=1600&q=80',
    coverAlt: 'Athlete rehabbing knee injury with therapist',
    sourceName: 'University of Southern California Performance Science Institute',
    sourceUrl: 'https://news.usc.edu/2024/injury-recovery-mindset/',
    tags: ['Injury', 'Mindset', 'Resilience'],
    publishedAt: '2024-05-12',
    contentMd: `# Mental Skills Matter in Rehab

## Toolkit
- Visualization of successful rehab sessions.
- Daily gratitude to offset frustration.
- Micro-goals: celebrate small mobility gains.
- Peer support: connect with teammates or online groups.

Mental resilience maintains adherence and reduces rehab dropouts.`,
  },
];

const seed = async () => {
  for (const article of articles) {
    const slug = article.slug || slugify(article.title, { lower: true, strict: true });
    const contentHtml = await marked.parse(article.contentMd);
    const readingMinutes = estimateReadingMinutes(article.contentMd);
    await prisma.article.upsert({
      where: { slug_locale: { slug, locale: 'en' } },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        coverUrl: article.coverUrl,
        coverAlt: article.coverAlt,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        tags: article.tags,
        bodyMarkdown: article.contentMd,
        contentHtml,
        readingMinutes,
        isFeatured: article.isFeatured ?? false,
        isPublished: true,
        publishedAt: new Date(article.publishedAt),
      },
      create: {
        slug,
        locale: 'en',
        title: article.title,
        excerpt: article.excerpt,
        coverUrl: article.coverUrl,
        coverAlt: article.coverAlt,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        tags: article.tags,
        bodyMarkdown: article.contentMd,
        contentHtml,
        readingMinutes,
        isFeatured: article.isFeatured ?? false,
        isPublished: true,
        publishedAt: new Date(article.publishedAt),
      },
    });
  }
};

seed()
  .then(async () => {
    console.log(`Seeded ${articles.length} articles.`);
  })
  .catch((error) => {
    console.error('Failed to seed articles', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

