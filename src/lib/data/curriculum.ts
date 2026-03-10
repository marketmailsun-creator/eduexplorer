// src/lib/data/curriculum.ts
// Static CBSE and ICSE curriculum data.
// Covers Classes 6–12 for CBSE; Classes 9–10 for ICSE.

export type BoardType = 'CBSE' | 'ICSE';

export interface CurriculumChapter {
  name: string;
  topics: string[];
}

export interface CurriculumSubject {
  name: string;
  emoji: string;
  chapters: CurriculumChapter[];
}

export interface CurriculumClass {
  classNumber: number;
  label: string; // e.g. "Class 6", "Class 11 (Science)"
  subjects: CurriculumSubject[];
}

export interface BoardCurriculum {
  board: BoardType;
  classes: CurriculumClass[];
}

// ─── CBSE ────────────────────────────────────────────────────────────────────

export const CBSE_CURRICULUM: BoardCurriculum = {
  board: 'CBSE',
  classes: [
    {
      classNumber: 6,
      label: 'Class 6',
      subjects: [
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Knowing Our Numbers', topics: ['Place Value', 'Large Numbers', 'Estimation', 'Roman Numerals'] },
            { name: 'Whole Numbers', topics: ['Natural Numbers', 'Whole Numbers', 'Number Line', 'Properties'] },
            { name: 'Playing with Numbers', topics: ['Factors and Multiples', 'LCM', 'HCF', 'Prime Factorisation'] },
            { name: 'Basic Geometrical Ideas', topics: ['Points, Lines, Rays', 'Angles', 'Curves', 'Polygons', 'Circles'] },
            { name: 'Fractions', topics: ['Types of Fractions', 'Equivalent Fractions', 'Addition', 'Subtraction'] },
            { name: 'Decimals', topics: ['Tenths and Hundredths', 'Comparing Decimals', 'Operations on Decimals'] },
            { name: 'Algebra', topics: ['Variables', 'Expressions', 'Equations'] },
            { name: 'Ratio and Proportion', topics: ['Ratio', 'Proportion', 'Unitary Method'] },
            { name: 'Mensuration', topics: ['Perimeter of Shapes', 'Area of Rectangle and Square'] },
          ],
        },
        {
          name: 'Science',
          emoji: '🔬',
          chapters: [
            { name: 'Food: Where Does It Come From?', topics: ['Food Variety', 'Food Sources', 'Plant Parts as Food', 'Animal Products'] },
            { name: 'Components of Food', topics: ['Nutrients', 'Carbohydrates', 'Proteins', 'Fats', 'Vitamins', 'Minerals', 'Balanced Diet', 'Deficiency Diseases'] },
            { name: 'Fibre to Fabric', topics: ['Natural Fibres', 'Cotton', 'Jute', 'Weaving', 'Knitting'] },
            { name: 'Sorting Materials into Groups', topics: ['Objects and Materials', 'Properties of Materials', 'Transparency'] },
            { name: 'Separation of Substances', topics: ['Threshing', 'Winnowing', 'Sieving', 'Filtration', 'Evaporation'] },
            { name: 'Changes Around Us', topics: ['Reversible Changes', 'Irreversible Changes'] },
            { name: 'Getting to Know Plants', topics: ['Herbs, Shrubs, Trees', 'Stem', 'Leaf', 'Root', 'Flower', 'Seed'] },
            { name: 'Body Movements', topics: ['Human Skeleton', 'Joints', 'Movement in Animals'] },
            { name: 'The Living Organisms and Their Surroundings', topics: ['Habitat', 'Adaptation', 'Biotic and Abiotic Components'] },
            { name: 'Motion and Measurement of Distances', topics: ['Measurement', 'SI Units', 'Types of Motion'] },
            { name: 'Light, Shadows and Reflections', topics: ['Transparent and Opaque Objects', 'Shadows', 'Mirrors', 'Pinhole Camera'] },
            { name: 'Electricity and Circuits', topics: ['Electric Cell', 'Electric Bulb', 'Electric Circuit', 'Conductors', 'Insulators'] },
            { name: 'Fun with Magnets', topics: ['Properties of Magnets', 'Poles', 'Magnetic and Non-magnetic Materials', 'Compass'] },
            { name: 'Water', topics: ['Sources of Water', 'Water Cycle', 'Rain Water Harvesting', 'Potable Water'] },
            { name: 'Air Around Us', topics: ['Composition of Air', 'Oxygen', 'Carbon Dioxide', 'Wind', 'Importance of Air'] },
          ],
        },
        {
          name: 'Social Science',
          emoji: '🌍',
          chapters: [
            { name: 'What, Where, How and When?', topics: ['History', 'Sources', 'Past and Present'] },
            { name: 'On the Trail of the Earliest People', topics: ['Hunter-Gatherers', 'Cave Paintings', 'Stone Tools'] },
            { name: 'From Gathering to Growing Food', topics: ['Agriculture', 'Domestication of Animals', 'Settlements'] },
            { name: 'In the Earliest Cities', topics: ['Harappan Civilisation', 'Town Planning', 'Trade'] },
            { name: 'The Earth in the Solar System', topics: ['Solar System', 'Planets', 'Moon', 'Stars', 'Constellations'] },
            { name: 'Globe: Latitudes and Longitudes', topics: ['Globe', 'Equator', 'Latitude', 'Longitude', 'Time Zones'] },
            { name: 'Motions of the Earth', topics: ['Rotation', 'Revolution', 'Day and Night', 'Seasons'] },
          ],
        },
      ],
    },
    {
      classNumber: 7,
      label: 'Class 7',
      subjects: [
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Integers', topics: ['Properties of Integers', 'Addition and Subtraction', 'Multiplication', 'Division'] },
            { name: 'Fractions and Decimals', topics: ['Multiplication of Fractions', 'Division of Fractions', 'Decimal Operations'] },
            { name: 'Data Handling', topics: ['Collection of Data', 'Mean', 'Median', 'Mode', 'Bar Graphs'] },
            { name: 'Simple Equations', topics: ['Setting up Equations', 'Solving Equations', 'Application'] },
            { name: 'Lines and Angles', topics: ['Related Angles', 'Pairs of Lines', 'Checking Parallel Lines'] },
            { name: 'The Triangle and Its Properties', topics: ['Median', 'Altitude', 'Exterior Angle', 'Angle Sum Property', 'Pythagoras Theorem'] },
            { name: 'Congruence of Triangles', topics: ['Congruent Figures', 'Criteria for Congruence (SSS, SAS, ASA, RHS)'] },
            { name: 'Comparing Quantities', topics: ['Equivalent Ratios', 'Percentage', 'Profit and Loss', 'Simple Interest'] },
            { name: 'Rational Numbers', topics: ['Positive and Negative Rational Numbers', 'Operations on Rational Numbers'] },
            { name: 'Perimeter and Area', topics: ['Triangles', 'Parallelogram', 'Circle', 'Conversion of Units'] },
            { name: 'Algebraic Expressions', topics: ['Terms', 'Factors', 'Coefficients', 'Addition and Subtraction'] },
            { name: 'Exponents and Powers', topics: ['Laws of Exponents', 'Decimal Number System', 'Expressing Large Numbers'] },
            { name: 'Symmetry', topics: ['Lines of Symmetry', 'Rotational Symmetry', 'Line Symmetry and Mirror Reflection'] },
          ],
        },
        {
          name: 'Science',
          emoji: '🔬',
          chapters: [
            { name: 'Nutrition in Plants', topics: ['Autotrophic Nutrition', 'Photosynthesis', 'Heterotrophic Nutrition', 'Nitrogen Cycle'] },
            { name: 'Nutrition in Animals', topics: ['Digestion in Humans', 'Teeth', 'Digestive System', 'Digestion in Grass-eating Animals', 'Feeding in Amoeba'] },
            { name: 'Fibre to Fabric', topics: ['Wool', 'Silk', 'Sericulture', 'Processing Fibres'] },
            { name: 'Heat', topics: ['Temperature', 'Thermometer', 'Transfer of Heat', 'Conduction', 'Convection', 'Radiation'] },
            { name: 'Acids, Bases and Salts', topics: ['Acid and Base Indicators', 'Neutralisation', 'Uses of Acids and Bases'] },
            { name: 'Physical and Chemical Changes', topics: ['Physical Changes', 'Chemical Changes', 'Rusting', 'Crystallisation'] },
            { name: 'Weather, Climate and Adaptation', topics: ['Weather', 'Climate', 'Adaptation in Polar Regions', 'Tropical Rainforests'] },
            { name: 'Winds, Storms and Cyclones', topics: ['Air Pressure', 'Wind', 'Cyclone', 'Tornadoes', 'Thunderstorms'] },
            { name: 'Soil', topics: ['Soil Profile', 'Types of Soil', 'Properties of Soil', 'Soil and Crops'] },
            { name: 'Respiration in Organisms', topics: ['Breathing', 'Types of Respiration', 'Aerobic and Anaerobic', 'Respiration in Organisms'] },
            { name: 'Transportation in Animals and Plants', topics: ['Circulatory System', 'Blood', 'Blood Vessels', 'Heart', 'Transport in Plants'] },
            { name: 'Reproduction in Plants', topics: ['Asexual Reproduction', 'Vegetative Propagation', 'Sexual Reproduction', 'Pollination', 'Seed Dispersal'] },
            { name: 'Motion and Time', topics: ['Speed', 'Measurement of Time', 'Distance-Time Graph', 'Units of Speed'] },
            { name: 'Electric Current and Its Effects', topics: ['Electric Circuit', 'Heating Effect', 'Magnetic Effect', 'Electromagnet', 'Electric Bell'] },
            { name: 'Light', topics: ['Laws of Reflection', 'Plane Mirror', 'Spherical Mirrors', 'Lenses', 'White Light and Spectrum'] },
            { name: 'Water: A Precious Resource', topics: ['Water Table', 'Water Cycle', 'Groundwater', 'Conservation of Water'] },
            { name: 'Forests: Our Lifeline', topics: ['Layers of Forest', 'Forest Food Web', 'Products from Forest', 'Deforestation'] },
          ],
        },
      ],
    },
    {
      classNumber: 8,
      label: 'Class 8',
      subjects: [
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Rational Numbers', topics: ['Properties', 'Representation on Number Line', 'Operations'] },
            { name: 'Linear Equations in One Variable', topics: ['Solving Linear Equations', 'Applications', 'Equations with Variables on Both Sides'] },
            { name: 'Understanding Quadrilaterals', topics: ['Polygons', 'Angle Sum Property', 'Parallelogram', 'Rectangle', 'Square', 'Rhombus', 'Kite'] },
            { name: 'Data Handling', topics: ['Pictographs', 'Bar Graphs', 'Circle Graphs', 'Probability', 'Histograms'] },
            { name: 'Squares and Square Roots', topics: ['Properties of Square Numbers', 'Finding Square Roots', 'Pythagorean Triplets'] },
            { name: 'Cubes and Cube Roots', topics: ['Perfect Cubes', 'Cube Roots', 'Method of Finding Cube Roots'] },
            { name: 'Comparing Quantities', topics: ['Ratio and Proportion', 'Percentage', 'Profit and Loss', 'Compound Interest', 'Discount', 'GST'] },
            { name: 'Algebraic Expressions and Identities', topics: ['Monomials, Binomials, Polynomials', 'Multiplication', 'Standard Identities'] },
            { name: 'Mensuration', topics: ['Area of Trapezium', 'Area of Polygon', 'Surface Area of Cube and Cuboid', 'Volume of Cube and Cuboid'] },
            { name: 'Exponents and Powers', topics: ['Powers with Negative Exponents', 'Laws of Exponents', 'Scientific Notation'] },
            { name: 'Factorisation', topics: ['Factors of Algebraic Expressions', 'Factorisation by Regrouping', 'Division of Algebraic Expressions'] },
            { name: 'Introduction to Graphs', topics: ['Bar Graphs', 'Pie Chart', 'Line Graphs', 'Coordinates', 'Linear Graphs'] },
          ],
        },
        {
          name: 'Science',
          emoji: '🔬',
          chapters: [
            { name: 'Crop Production and Management', topics: ['Types of Crops', 'Crop Seasons', 'Irrigation', 'Fertilisers', 'Food Storage'] },
            { name: 'Microorganisms: Friend and Foe', topics: ['Types of Microorganisms', 'Bacteria', 'Viruses', 'Fungi', 'Useful Microorganisms', 'Diseases', 'Food Preservation'] },
            { name: 'Synthetic Fibres and Plastics', topics: ['Types of Synthetic Fibres', 'Rayon', 'Nylon', 'Polyester', 'Plastics', 'Biodegradable Materials'] },
            { name: 'Materials: Metals and Non-metals', topics: ['Physical Properties', 'Chemical Properties', 'Reactions with Oxygen', 'Reactions with Water', 'Displacement Reactions'] },
            { name: 'Coal and Petroleum', topics: ['Natural Resources', 'Coal', 'Petroleum', 'Natural Gas', 'Fossil Fuels'] },
            { name: 'Combustion and Flame', topics: ['Types of Combustion', 'Ignition Temperature', 'Flammable Substances', 'Structure of Flame', 'Fire Control'] },
            { name: 'Conservation of Plants and Animals', topics: ['Deforestation', 'Biosphere Reserves', 'Wildlife Sanctuary', 'National Park', 'Endangered Species', 'Red Data Book'] },
            { name: 'Cell — Structure and Functions', topics: ['Unicellular and Multicellular', 'Cell Structure', 'Cell Wall', 'Cell Membrane', 'Nucleus', 'Cytoplasm', 'Vacuole'] },
            { name: 'Reproduction in Animals', topics: ['Sexual Reproduction', 'Male and Female Reproductive Organs', 'Fertilisation', 'Asexual Reproduction'] },
            { name: 'Reaching the Age of Adolescence', topics: ['Puberty', 'Secondary Sexual Characters', 'Role of Hormones', 'Reproductive Health'] },
            { name: 'Force and Pressure', topics: ['Contact and Non-contact Forces', 'Pressure', 'Atmospheric Pressure', 'Liquid Pressure'] },
            { name: 'Friction', topics: ['Types of Friction', 'Static Friction', 'Sliding Friction', 'Rolling Friction', 'Increasing and Decreasing Friction'] },
            { name: 'Sound', topics: ['Vibration and Sound', 'Propagation of Sound', 'Amplitude', 'Frequency', 'Pitch', 'Noise Pollution'] },
            { name: 'Chemical Effects of Electric Current', topics: ['Electrical Conductivity of Liquids', 'Electrolysis', 'Electroplating'] },
            { name: 'Some Natural Phenomena', topics: ['Lightning', 'Electric Charge', 'Charging by Rubbing', 'Earthquake'] },
            { name: 'Light', topics: ['Reflection of Light', 'Regular and Diffused Reflection', 'Multiple Reflections', 'Human Eye', 'Braille System'] },
            { name: 'Stars and the Solar System', topics: ['Moon', 'Stars and Constellations', 'Solar System', 'Satellites', 'Comets'] },
            { name: 'Pollution of Air and Water', topics: ['Air Pollution', 'Pollutants', 'Greenhouse Effect', 'Water Pollution', 'Potable Water'] },
          ],
        },
        {
          name: 'Social Science — History',
          emoji: '🏛️',
          chapters: [
            { name: 'How, When and Where', topics: ['Colonialism', 'Dates in History', 'Sources of History'] },
            { name: 'From Trade to Territory', topics: ['East India Company', 'Battle of Plassey', 'Battle of Buxar', 'British Expansion'] },
            { name: 'Ruling the Countryside', topics: ['Ryotwari System', 'Indigo Cultivation', 'Plantation Agriculture'] },
            { name: 'Tribals, Dikus and the Vision of a Golden Age', topics: ['Tribal Communities', 'British Policies', 'Birsa Munda'] },
            { name: 'When People Rebel', topics: ['Sepoy Mutiny 1857', 'Causes', 'Aftermath'] },
            { name: 'Civilising the "Native", Educating the Nation', topics: ['British Education Policy', 'English Medium Education', 'Debates'] },
          ],
        },
      ],
    },
    {
      classNumber: 9,
      label: 'Class 9',
      subjects: [
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Number Systems', topics: ['Irrational Numbers', 'Real Numbers', 'Number Line', 'Laws of Exponents for Real Numbers'] },
            { name: 'Polynomials', topics: ['Degree of Polynomial', 'Remainder Theorem', 'Factor Theorem', 'Factorisation'] },
            { name: 'Coordinate Geometry', topics: ['Cartesian System', 'Plotting Points', 'Quadrants'] },
            { name: 'Linear Equations in Two Variables', topics: ['Solutions of Linear Equations', 'Graph of Linear Equations', 'Equations of Lines Parallel to Axes'] },
            { name: "Introduction to Euclid's Geometry", topics: ["Euclid's Definitions", 'Axioms and Postulates', 'Equivalent Versions of Fifth Postulate'] },
            { name: 'Lines and Angles', topics: ['Intersecting and Non-intersecting Lines', 'Pairs of Angles', 'Parallel Lines', 'Angle Sum Property of Triangle'] },
            { name: 'Triangles', topics: ['Congruence of Triangles', 'Criteria (SSS, SAS, ASA, AAS, RHS)', 'Properties of Isosceles Triangle'] },
            { name: 'Quadrilaterals', topics: ['Angle Sum Property', 'Properties of Parallelogram', 'Mid-point Theorem'] },
            { name: 'Circles', topics: ['Chord Properties', 'Arc', 'Inscribed Angles', 'Cyclic Quadrilaterals'] },
            { name: "Heron's Formula", topics: ["Area of Triangle by Heron's Formula", 'Application to Quadrilaterals'] },
            { name: 'Surface Areas and Volumes', topics: ['Cuboid', 'Cylinder', 'Cone', 'Sphere', 'Hemisphere'] },
            { name: 'Statistics', topics: ['Collection and Presentation of Data', 'Mean', 'Median', 'Mode', 'Bar Graphs', 'Histograms', 'Frequency Polygons'] },
            { name: 'Probability', topics: ['Experimental Probability', 'Probability of Events', 'Empirical Probability'] },
          ],
        },
        {
          name: 'Science (Physics)',
          emoji: '⚛️',
          chapters: [
            { name: 'Motion', topics: ['Distance and Displacement', 'Speed, Velocity, Acceleration', 'Equations of Motion', 'Uniform and Non-uniform Motion', 'Graphical Representation'] },
            { name: 'Force and Laws of Motion', topics: ["Balanced and Unbalanced Forces", "Newton's First Law (Inertia)", "Newton's Second Law (F=ma)", "Newton's Third Law", 'Conservation of Momentum'] },
            { name: 'Gravitation', topics: ['Universal Law of Gravitation', 'Free Fall', 'Mass and Weight', 'Thrust and Pressure', 'Buoyancy', "Archimedes' Principle"] },
            { name: 'Work and Energy', topics: ['Work Done by a Force', 'Kinetic Energy', 'Potential Energy', 'Law of Conservation of Energy', 'Power', 'Commercial Unit of Energy'] },
            { name: 'Sound', topics: ['Production and Propagation of Sound', 'Frequency and Amplitude', 'Speed of Sound', 'Reflection of Sound', 'Echo', 'SONAR', 'Human Ear'] },
            { name: 'Light — Reflection and Refraction', topics: ['Laws of Reflection', 'Plane Mirror', 'Spherical Mirrors', 'Concave and Convex Mirror', 'Mirror Formula', 'Magnification', 'Refraction of Light', 'Laws of Refraction', 'Refractive Index', 'Convex and Concave Lens', 'Lens Formula', 'Power of Lens'] },
          ],
        },
        {
          name: 'Science (Chemistry)',
          emoji: '🧪',
          chapters: [
            { name: 'Matter in Our Surroundings', topics: ['Physical Nature of Matter', 'States of Matter', 'Evaporation', 'Latent Heat', 'Sublimation', 'Plasma', 'Bose-Einstein Condensate'] },
            { name: 'Is Matter Around Us Pure?', topics: ['Pure Substances', 'Mixtures', 'Separation Methods', 'Solution', 'Colloid', 'Suspension'] },
            { name: 'Atoms and Molecules', topics: ['Laws of Chemical Combination', "Dalton's Atomic Theory", 'Atomic Mass', 'Molecules', 'Mole Concept'] },
            { name: 'Structure of the Atom', topics: ["Charged Particles in Matter", "Thomson's Model", "Rutherford's Model", "Bohr's Model", 'Valence Electrons', 'Isotopes', 'Isobars'] },
          ],
        },
        {
          name: 'Science (Biology)',
          emoji: '🌱',
          chapters: [
            { name: 'The Fundamental Unit of Life (Cell)', topics: ['Prokaryotic and Eukaryotic Cells', 'Cell Organelles', 'Nucleus', 'Mitochondria', 'Plastids', 'Vacuoles', 'Cell Division'] },
            { name: 'Tissues', topics: ['Plant Tissues', 'Meristematic Tissue', 'Permanent Tissue', 'Animal Tissues', 'Epithelial', 'Connective', 'Muscular', 'Nervous Tissue'] },
            { name: 'Diversity in Living Organisms', topics: ['Basis of Classification', 'Kingdom Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia', 'Nomenclature'] },
            { name: 'Why Do We Fall Ill?', topics: ['Health and Disease', 'Causes of Disease', 'Infectious Diseases', 'Antibiotics', 'Vaccines', 'Immune System'] },
            { name: 'Natural Resources', topics: ['Air', 'Water', 'Soil', 'Nitrogen Cycle', 'Carbon Cycle', 'Biogeochemical Cycles', 'Ozone Layer'] },
            { name: 'Improvement in Food Resources', topics: ['Crop Improvement', 'Crop Variety', 'Irrigation', 'Crop Protection', 'Animal Husbandry', 'Aquaculture'] },
          ],
        },
        {
          name: 'Social Science — History',
          emoji: '🏛️',
          chapters: [
            { name: 'The French Revolution', topics: ['Old Regime', 'Causes', 'Key Events', 'Declaration of Rights of Man', 'Reign of Terror', 'Napoleon', 'Legacy'] },
            { name: 'Socialism in Europe and the Russian Revolution', topics: ['Liberals, Radicals, Conservatives', 'Socialism', 'Marxism', 'Russian Revolution 1917', "Stalin's Russia"] },
            { name: 'Nazism and the Rise of Hitler', topics: ['Weimar Republic', 'Great Depression', 'Rise of Hitler', 'Nazi Ideology', 'Holocaust', 'World War II'] },
            { name: 'Forest Society and Colonialism', topics: ['Colonial Forests', 'Scientific Forestry', 'Forest Laws', 'Rebellions'] },
            { name: 'Pastoralists in the Modern World', topics: ['Nomadic Pastoralism', 'Colonial Impact', 'Pastoralists in India and Africa'] },
          ],
        },
        {
          name: 'Social Science — Geography',
          emoji: '🗺️',
          chapters: [
            { name: 'India — Size and Location', topics: ['Geographical Features', 'Latitude and Longitude', 'Neighbours of India', 'Standard Meridian'] },
            { name: 'Physical Features of India', topics: ['Himalayas', 'Northern Plains', 'Peninsular Plateau', 'Indian Desert', 'Coastal Plains', 'Islands'] },
            { name: 'Drainage', topics: ['Drainage Basin', 'Himalayan Rivers', 'Peninsular Rivers', 'Lakes'] },
            { name: 'Climate', topics: ['Factors Affecting Climate', 'Monsoon', 'Seasons in India', 'Distribution of Rainfall'] },
            { name: 'Natural Vegetation and Wildlife', topics: ['Forests', 'Grasslands', 'Types of Vegetation', 'Wildlife Conservation'] },
            { name: 'Population', topics: ['Population Growth', 'Distribution', 'Density', 'Age-Sex Composition', 'Literacy', 'Health'] },
          ],
        },
        {
          name: 'Social Science — Civics',
          emoji: '⚖️',
          chapters: [
            { name: 'Democracy in the Contemporary World', topics: ['Definition of Democracy', 'Features', 'Evolution', 'Democracy vs Dictatorship'] },
            { name: 'Constitutional Design', topics: ['Making of Constitution', 'Preamble', 'Fundamental Rights', 'Directive Principles'] },
            { name: 'Electoral Politics', topics: ['Why Elections?', 'Election Commission', 'Voting', 'Fair Elections'] },
            { name: 'Working of Institutions', topics: ['Parliament', 'Executive', 'Judiciary', 'Political Executive'] },
            { name: 'Democratic Rights', topics: ['Fundamental Rights', 'Rights in Practice', 'Expanding Democracy'] },
          ],
        },
        {
          name: 'English Literature',
          emoji: '📖',
          chapters: [
            { name: 'The Fun They Had', topics: ['Futuristic Schools', 'Technology and Education', "Asimov's Vision"] },
            { name: 'The Road Not Taken', topics: ['Robert Frost', 'Symbolism', 'Life Choices', 'Theme of Individuality'] },
            { name: 'The Sound of Music', topics: ['Evelyn Glennie', 'Bismillah Khan', 'Determination', 'Perseverance'] },
            { name: 'The Little Girl', topics: ['Parent-Child Relationship', 'Katherine Mansfield', 'Fear and Love'] },
            { name: 'A Truly Beautiful Mind', topics: ['Albert Einstein', 'Genius', 'Peace', 'Science and Humanity'] },
          ],
        },
      ],
    },
    {
      classNumber: 10,
      label: 'Class 10',
      subjects: [
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Real Numbers', topics: ["Euclid's Division Lemma", 'Fundamental Theorem of Arithmetic', 'Irrational Numbers', 'Decimal Expansions'] },
            { name: 'Polynomials', topics: ['Zeros of Polynomials', 'Relationship between Zeros and Coefficients', 'Division Algorithm'] },
            { name: 'Pair of Linear Equations in Two Variables', topics: ['Graphical Method', 'Substitution', 'Elimination', 'Cross-multiplication'] },
            { name: 'Quadratic Equations', topics: ['Standard Form', 'Factorisation Method', 'Quadratic Formula', 'Discriminant', 'Nature of Roots'] },
            { name: 'Arithmetic Progressions', topics: ['General Term (nth Term)', 'Sum of n Terms', 'Applications'] },
            { name: 'Triangles', topics: ['Similarity', 'Basic Proportionality Theorem', 'Criteria for Similarity', 'Areas of Similar Triangles', 'Pythagoras Theorem'] },
            { name: 'Coordinate Geometry', topics: ['Distance Formula', 'Section Formula', 'Area of Triangle'] },
            { name: 'Introduction to Trigonometry', topics: ['Trigonometric Ratios', 'Reciprocal Relations', 'Trigonometric Identities', 'Values at Specific Angles'] },
            { name: 'Applications of Trigonometry', topics: ['Heights and Distances', 'Angle of Elevation', 'Angle of Depression'] },
            { name: 'Circles', topics: ['Tangent to a Circle', 'Number of Tangents from External Point', 'Tangent Properties'] },
            { name: 'Areas Related to Circles', topics: ['Area of Sector', 'Area of Segment', 'Combination of Figures'] },
            { name: 'Surface Areas and Volumes', topics: ['Combination of Solids', 'Conversion of Solids', 'Frustum of Cone'] },
            { name: 'Statistics', topics: ['Mean (Direct, Assumed Mean, Step Deviation)', 'Median', 'Mode', 'Cumulative Frequency Graphs'] },
            { name: 'Probability', topics: ['Classical Definition', 'Theoretical Probability', 'Complementary Events'] },
          ],
        },
        {
          name: 'Science (Physics)',
          emoji: '⚛️',
          chapters: [
            { name: 'Light — Reflection and Refraction', topics: ['Laws of Reflection', 'Spherical Mirrors', 'Mirror Formula', 'Refraction', "Snell's Law", 'Refractive Index', 'Lens Formula', 'Power of Lens', 'Total Internal Reflection'] },
            { name: 'Human Eye and the Colourful World', topics: ['Human Eye', 'Power of Accommodation', 'Defects of Vision', 'Dispersion of Light', 'Scattering of Light', 'Rainbow', 'Tyndall Effect'] },
            { name: 'Electricity', topics: ['Electric Current', 'Electric Circuit', "Ohm's Law", 'Resistance', 'Resistors in Series and Parallel', 'Heating Effect', 'Electric Power'] },
            { name: 'Magnetic Effects of Electric Current', topics: ['Magnetic Field', 'Field due to Current-carrying Conductor', 'Flemings Left Hand Rule', 'Electric Motor', 'Electromagnetic Induction', 'Electric Generator', 'AC vs DC'] },
            { name: 'Sources of Energy', topics: ['Conventional Sources', 'Non-conventional Sources', 'Fossil Fuels', 'Thermal Power Plant', 'Hydro Power', 'Solar Energy', 'Wind Energy', 'Nuclear Energy', 'Tidal Energy'] },
          ],
        },
        {
          name: 'Science (Chemistry)',
          emoji: '🧪',
          chapters: [
            { name: 'Chemical Reactions and Equations', topics: ['Writing Equations', 'Balancing Equations', 'Types of Reactions', 'Oxidation and Reduction', 'Corrosion', 'Rancidity'] },
            { name: 'Acids, Bases and Salts', topics: ['Properties', 'pH Scale', 'Indicators', 'Neutralisation', 'Salts', 'Water of Crystallisation'] },
            { name: 'Metals and Non-metals', topics: ['Physical Properties', 'Chemical Properties', 'Reactivity Series', 'Extraction of Metals', 'Corrosion', 'Alloys'] },
            { name: 'Carbon and Its Compounds', topics: ['Covalent Bond', 'Versatile Nature of Carbon', 'Homologous Series', 'Hydrocarbons', 'Functional Groups', 'Ethanol', 'Soap and Detergents'] },
            { name: 'Classification of Elements', topics: ['Early Attempts at Classification', "Mendeleev's Periodic Table", 'Modern Periodic Table', 'Trends in Periodic Table'] },
          ],
        },
        {
          name: 'Science (Biology)',
          emoji: '🌱',
          chapters: [
            { name: 'Life Processes', topics: ['Nutrition', 'Respiration', 'Transportation in Plants', 'Transportation in Animals', 'Excretion'] },
            { name: 'Control and Coordination', topics: ['Nervous System', 'Reflex Action', 'Human Brain', 'Hormones', 'Endocrine System', 'Feedback Mechanism'] },
            { name: 'How Do Organisms Reproduce?', topics: ['Asexual Reproduction', 'Sexual Reproduction', 'Reproduction in Plants', 'Reproduction in Humans'] },
            { name: 'Heredity and Evolution', topics: ['Heredity', "Mendel's Laws", 'Sex Determination', 'Evolution', 'Darwin', 'Speciation', 'Fossils'] },
            { name: 'Our Environment', topics: ['Ecosystem', 'Food Chains and Webs', 'Trophic Levels', 'Ozone Depletion', 'Waste Management'] },
            { name: 'Management of Natural Resources', topics: ["Conservation of Natural Resources", "Three R's (Reduce, Reuse, Recycle)", 'Dams', 'Forests', 'Coal and Petroleum'] },
          ],
        },
        {
          name: 'English Literature',
          emoji: '📖',
          chapters: [
            { name: 'A Letter to God', topics: ['Faith', 'Irony', 'Hope', 'G.L. Fuentes'] },
            { name: 'Nelson Mandela: Long Walk to Freedom', topics: ['Apartheid', 'Freedom Struggle', 'Courage', 'Autobiography'] },
            { name: 'Two Stories about Flying', topics: ['Black Aeroplane', 'His First Flight', 'Courage', 'Symbolism'] },
            { name: 'From the Diary of Anne Frank', topics: ['Holocaust', 'World War II', 'Diary Writing', 'Resilience'] },
            { name: 'The Hundred Dresses', topics: ['Bullying', 'Empathy', 'Social Issues'] },
          ],
        },
      ],
    },
    {
      classNumber: 11,
      label: 'Class 11 (Science)',
      subjects: [
        {
          name: 'Physics',
          emoji: '⚛️',
          chapters: [
            { name: 'Physical World', topics: ['Scope of Physics', 'Fundamental Forces', 'Nature of Physical Laws'] },
            { name: 'Units and Measurements', topics: ['SI Units', 'Dimensions', 'Significant Figures', 'Errors in Measurement'] },
            { name: 'Motion in a Straight Line', topics: ['Position-Time Graph', 'Speed and Velocity', 'Acceleration', 'Kinematic Equations'] },
            { name: 'Motion in a Plane', topics: ['Vectors', 'Projectile Motion', 'Uniform Circular Motion', 'Relative Velocity'] },
            { name: 'Laws of Motion', topics: ["Newton's Laws", 'Friction', 'Circular Motion', 'Free Body Diagrams'] },
            { name: 'Work, Energy and Power', topics: ['Work-Energy Theorem', 'Kinetic and Potential Energy', 'Conservation of Energy', 'Power', 'Elastic Collisions'] },
            { name: 'System of Particles and Rotational Motion', topics: ['Centre of Mass', 'Torque', 'Angular Momentum', 'Moment of Inertia', 'Rolling Motion'] },
            { name: 'Gravitation', topics: ["Kepler's Laws", 'Universal Gravitation', 'Gravitational Potential Energy', 'Satellites', 'Escape Velocity'] },
            { name: 'Mechanical Properties of Solids', topics: ['Stress and Strain', "Hooke's Law", "Young's Modulus", 'Shear and Bulk Modulus'] },
            { name: 'Mechanical Properties of Fluids', topics: ['Pressure', "Bernoulli's Theorem", 'Viscosity', 'Surface Tension', 'Streamline and Turbulent Flow'] },
            { name: 'Thermal Properties of Matter', topics: ['Temperature', 'Thermal Expansion', 'Specific Heat Capacity', 'Latent Heat', 'Heat Transfer'] },
            { name: 'Thermodynamics', topics: ['Thermal Equilibrium', 'Laws of Thermodynamics', 'Isothermal and Adiabatic Processes', 'Heat Engines', 'Efficiency'] },
            { name: 'Kinetic Theory', topics: ['Molecular Nature of Matter', 'Kinetic Theory of Gases', 'Law of Equipartition of Energy', 'Specific Heat Capacities of Gases'] },
            { name: 'Oscillations', topics: ['Periodic Motion', 'Simple Harmonic Motion', 'Spring-Mass System', 'Simple Pendulum', 'Damped Oscillations'] },
            { name: 'Waves', topics: ['Wave Motion', 'Transverse and Longitudinal Waves', 'Speed of Wave', 'Superposition', 'Reflection', 'Interference', 'Beats', 'Doppler Effect'] },
          ],
        },
        {
          name: 'Chemistry',
          emoji: '🧪',
          chapters: [
            { name: 'Some Basic Concepts of Chemistry', topics: ['Matter', 'SI Units', 'Mole Concept', 'Molar Mass', 'Empirical Formula', 'Stoichiometry'] },
            { name: 'Structure of Atom', topics: ['Atomic Models', 'Quantum Mechanical Model', 'Orbitals', 'Quantum Numbers', 'Electronic Configuration'] },
            { name: 'Classification of Elements and Periodicity', topics: ['Historical Development', 'Modern Periodic Table', 'Periodic Trends', 'Electronegativity', 'Ionisation Energy'] },
            { name: 'Chemical Bonding and Molecular Structure', topics: ['Ionic Bond', 'Covalent Bond', 'VSEPR Theory', 'Valence Bond Theory', 'Hybridisation', 'Molecular Orbital Theory'] },
            { name: 'Thermodynamics', topics: ['System and Surroundings', 'Enthalpy', 'Entropy', "Gibb's Free Energy", "Hess's Law"] },
            { name: 'Equilibrium', topics: ['Chemical Equilibrium', "Le Chatelier's Principle", 'Ionic Equilibrium', 'pH', 'Buffer Solutions', 'Solubility Product'] },
            { name: 'Redox Reactions', topics: ['Oxidation State', 'Redox Reactions', 'Balancing Redox Reactions', 'Applications'] },
            { name: 'Hydrogen', topics: ['Position in Periodic Table', 'Preparation', 'Properties', 'Water', 'Heavy Water', 'Hydrogen Peroxide'] },
            { name: 'The s-Block Elements', topics: ['Group 1 Alkali Metals', 'Group 2 Alkaline Earth Metals', 'Anomalous Properties', 'Compounds'] },
            { name: 'The p-Block Elements', topics: ['Group 13 to 18', 'Boron Family', 'Carbon Family', 'Nitrogen Family', 'Oxygen Family', 'Halogen Family', 'Noble Gases'] },
            { name: 'Organic Chemistry — Basic Principles', topics: ['Classification of Organic Compounds', 'IUPAC Nomenclature', 'Isomerism', 'Inductive Effect', 'Resonance'] },
            { name: 'Hydrocarbons', topics: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatic Hydrocarbons', 'Reactions'] },
          ],
        },
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Sets', topics: ['Types of Sets', 'Set Operations', 'Venn Diagrams', 'Laws of Algebra of Sets'] },
            { name: 'Relations and Functions', topics: ['Cartesian Product', 'Relations', 'Functions', 'Types of Functions'] },
            { name: 'Trigonometric Functions', topics: ['Angle Measurement', 'Trigonometric Ratios', 'Graphs', 'Identities', 'General Solutions'] },
            { name: 'Principle of Mathematical Induction', topics: ['Induction Step', 'Base Case', 'Applications'] },
            { name: 'Complex Numbers', topics: ['Imaginary Unit', 'Algebra of Complex Numbers', 'Polar Form', 'Argand Plane', "De Moivre's Theorem"] },
            { name: 'Linear Inequalities', topics: ['Graphical Solutions', 'System of Inequalities', 'Word Problems'] },
            { name: 'Permutations and Combinations', topics: ['Fundamental Principle', 'Permutations', 'Combinations', 'Applications'] },
            { name: 'Binomial Theorem', topics: ['Binomial Expansion', 'General Term', 'Middle Term', "Pascal's Triangle"] },
            { name: 'Sequences and Series', topics: ['AP', 'GP', 'Sum of Infinite GP', 'AM-GM Inequality'] },
            { name: 'Straight Lines', topics: ['Slope', 'Forms of Equations', 'Angle between Lines', 'Distance Formulas'] },
            { name: 'Conic Sections', topics: ['Circle', 'Parabola', 'Ellipse', 'Hyperbola', 'Standard Equations'] },
            { name: 'Limits and Derivatives', topics: ['Concept of Limit', 'Algebra of Limits', 'Derivative', 'Rules of Differentiation'] },
            { name: 'Statistics', topics: ['Measures of Dispersion', 'Range', 'Mean Deviation', 'Variance', 'Standard Deviation'] },
            { name: 'Probability', topics: ['Random Experiments', 'Events', 'Addition Theorem', 'Conditional Probability'] },
          ],
        },
        {
          name: 'Biology',
          emoji: '🌱',
          chapters: [
            { name: 'The Living World', topics: ['Characteristics of Life', 'Diversity of Life', 'Taxonomy', 'Nomenclature'] },
            { name: 'Biological Classification', topics: ['Five Kingdom Classification', 'Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'] },
            { name: 'Plant Kingdom', topics: ['Algae', 'Bryophytes', 'Pteridophytes', 'Gymnosperms', 'Angiosperms', 'Plant Life Cycles'] },
            { name: 'Animal Kingdom', topics: ['Basis of Classification', 'Non-Chordates', 'Chordates', 'Vertebrates'] },
            { name: 'Morphology of Flowering Plants', topics: ['Root', 'Stem', 'Leaf', 'Inflorescence', 'Flower', 'Fruit', 'Seed'] },
            { name: 'Anatomy of Flowering Plants', topics: ['Plant Tissues', 'Anatomy of Root', 'Stem', 'Leaf'] },
            { name: 'Structural Organisation in Animals', topics: ['Animal Tissues', 'Organ Systems', 'Cockroach', 'Frog', 'Earthworm'] },
            { name: 'Cell — The Unit of Life', topics: ['Prokaryotic Cell', 'Eukaryotic Cell', 'Cell Organelles', 'Membrane'] },
            { name: 'Biomolecules', topics: ['Carbohydrates', 'Proteins', 'Lipids', 'Nucleic Acids', 'Enzymes'] },
            { name: 'Cell Cycle and Cell Division', topics: ['Cell Cycle', 'Mitosis', 'Meiosis', 'Significance'] },
            { name: 'Transport in Plants', topics: ['Osmosis', 'Plasmolysis', 'Active Transport', 'Phloem Transport', 'Xylem Transport'] },
            { name: 'Mineral Nutrition', topics: ['Essential Mineral Elements', 'Deficiency Symptoms', 'Nitrogen Fixation'] },
            { name: 'Photosynthesis', topics: ['Light Reactions', 'Calvin Cycle', 'C4 Pathway', 'Photorespiration', 'Factors Affecting'] },
            { name: 'Respiration in Plants', topics: ['Aerobic Respiration', 'Fermentation', 'Glycolysis', 'Krebs Cycle', 'Electron Transport Chain'] },
            { name: 'Digestion and Absorption', topics: ['Human Digestive System', 'Digestion Process', 'Absorption', 'Disorders'] },
            { name: 'Breathing and Exchange of Gases', topics: ['Respiratory Organs', 'Mechanism of Breathing', 'Gas Exchange', 'Transport of Gases', 'Disorders'] },
            { name: 'Body Fluids and Circulation', topics: ['Blood', 'Heart', 'Cardiac Cycle', 'ECG', 'Lymph', 'Blood Disorders'] },
            { name: 'Excretory Products and Elimination', topics: ['Kidney', 'Urine Formation', 'Tubular Reabsorption', 'Regulation'] },
            { name: 'Locomotion and Movement', topics: ['Types of Movement', 'Skeletal System', 'Joints', 'Muscle Contraction', 'Disorders'] },
            { name: 'Neural Control and Coordination', topics: ['Neuron', 'Nerve Impulse', 'Brain', 'Spinal Cord', 'Sense Organs'] },
            { name: 'Chemical Coordination and Integration', topics: ['Endocrine Glands', 'Hormones', 'Feedback Mechanism', 'Disorders'] },
          ],
        },
      ],
    },
    {
      classNumber: 12,
      label: 'Class 12 (Science)',
      subjects: [
        {
          name: 'Physics',
          emoji: '⚛️',
          chapters: [
            { name: 'Electric Charges and Fields', topics: ["Coulomb's Law", 'Electric Field', "Gauss's Law", 'Electric Potential Energy'] },
            { name: 'Electrostatic Potential and Capacitance', topics: ['Electric Potential', 'Equipotential Surfaces', 'Capacitor', 'Dielectrics', 'Energy Stored'] },
            { name: 'Current Electricity', topics: ['Electric Current', "Ohm's Law", "Kirchhoff's Laws", 'Wheatstone Bridge', 'Meter Bridge', 'Potentiometer'] },
            { name: 'Moving Charges and Magnetism', topics: ['Magnetic Force on Current', 'Biot-Savart Law', "Ampere's Law", 'Solenoid', 'Galvanometer'] },
            { name: 'Magnetism and Matter', topics: ['Bar Magnet', "Earth's Magnetism", 'Diamagnetic, Paramagnetic, Ferromagnetic', 'Hysteresis'] },
            { name: 'Electromagnetic Induction', topics: ["Faraday's Law", "Lenz's Law", 'Motional EMF', 'Eddy Currents', 'Self Inductance', 'Mutual Inductance'] },
            { name: 'Alternating Current', topics: ['AC Generator', 'AC Circuits', 'Phasors', 'Resonance', 'LC Oscillations', 'Transformer'] },
            { name: 'Electromagnetic Waves', topics: ['Displacement Current', 'Electromagnetic Spectrum', 'Properties of EM Waves'] },
            { name: 'Ray Optics and Optical Instruments', topics: ['Reflection', 'Refraction', 'Total Internal Reflection', 'Lenses', 'Prism', 'Microscope', 'Telescope'] },
            { name: 'Wave Optics', topics: ['Wavefront', "Huygens Principle", 'Interference', "Young's Double Slit", 'Diffraction', 'Polarisation'] },
            { name: 'Dual Nature of Radiation and Matter', topics: ['Photoelectric Effect', "Einstein's Equation", 'de Broglie Hypothesis', 'Davisson-Germer Experiment'] },
            { name: 'Atoms', topics: ['Rutherford Model', 'Bohr Model', 'Hydrogen Spectrum', 'Energy Levels'] },
            { name: 'Nuclei', topics: ['Nuclear Size and Mass', 'Binding Energy', 'Radioactivity', 'Nuclear Fission', 'Nuclear Fusion'] },
            { name: 'Semiconductor Electronics', topics: ['Energy Bands', 'p-n Junction', 'Diode', 'Transistor', 'Logic Gates', 'Digital Circuits'] },
          ],
        },
        {
          name: 'Chemistry',
          emoji: '🧪',
          chapters: [
            { name: 'The Solid State', topics: ['Types of Solids', 'Crystal Lattice', 'Unit Cell', 'Packing Efficiency', 'Point Defects'] },
            { name: 'Solutions', topics: ['Types of Solutions', 'Concentration', 'Colligative Properties', "Raoult's Law", 'Osmotic Pressure'] },
            { name: 'Electrochemistry', topics: ['Electrochemical Cells', 'Nernst Equation', 'Electrolysis', 'Conductance', 'Kohlrausch Law'] },
            { name: 'Chemical Kinetics', topics: ['Rate of Reaction', 'Rate Laws', 'Order of Reaction', 'Activation Energy', 'Arrhenius Equation'] },
            { name: 'Surface Chemistry', topics: ['Adsorption', 'Catalysis', 'Colloids', 'Emulsions'] },
            { name: 'The d- and f-Block Elements', topics: ['Transition Elements', 'Properties', 'Compounds', 'Lanthanoids', 'Actinoids'] },
            { name: 'Coordination Compounds', topics: ['IUPAC Nomenclature', 'Crystal Field Theory', 'Isomerism', 'Biological Importance'] },
            { name: 'Haloalkanes and Haloarenes', topics: ['Preparation', 'Properties', 'Nucleophilic Substitution', 'Elimination Reactions'] },
            { name: 'Alcohols, Phenols and Ethers', topics: ['Preparation', 'Physical and Chemical Properties', 'Important Reactions'] },
            { name: 'Aldehydes, Ketones and Carboxylic Acids', topics: ['Nucleophilic Addition', 'Oxidation-Reduction', 'Aldol Condensation', 'Carboxylic Acid Derivatives'] },
            { name: 'Amines', topics: ['Classification', 'Preparation', 'Properties', 'Diazonium Salts'] },
            { name: 'Biomolecules', topics: ['Carbohydrates', 'Proteins and Enzymes', 'Vitamins', 'Nucleic Acids', 'Hormones'] },
            { name: 'Polymers', topics: ['Classification', 'Addition Polymers', 'Condensation Polymers', 'Rubber'] },
            { name: 'Chemistry in Everyday Life', topics: ['Drugs and Medicines', 'Chemicals in Food', 'Cleansing Agents'] },
          ],
        },
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Relations and Functions', topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions', 'Inverse Functions'] },
            { name: 'Inverse Trigonometric Functions', topics: ['Principal Value', 'Properties', 'Graphs'] },
            { name: 'Matrices', topics: ['Types of Matrices', 'Matrix Operations', 'Transpose', 'Symmetric and Skew-symmetric'] },
            { name: 'Determinants', topics: ['Determinant Expansion', 'Properties', 'Cofactors', 'Inverse of Matrix', "Cramer's Rule"] },
            { name: 'Continuity and Differentiability', topics: ['Continuous Functions', 'Differentiability', 'Chain Rule', 'Logarithmic Differentiation', 'Parametric Forms', 'Second Order Derivatives', "Rolle's and Mean Value Theorems"] },
            { name: 'Application of Derivatives', topics: ['Rate of Change', 'Increasing and Decreasing Functions', 'Tangents and Normals', 'Maxima and Minima'] },
            { name: 'Integrals', topics: ['Integration as Inverse of Differentiation', 'Methods of Integration', 'Definite Integrals', 'Fundamental Theorem'] },
            { name: 'Application of Integrals', topics: ['Area under Simple Curves', 'Area between Two Curves'] },
            { name: 'Differential Equations', topics: ['Order and Degree', 'Forming Differential Equations', 'Separation of Variables', 'Homogeneous and Linear Equations'] },
            { name: 'Vector Algebra', topics: ['Types of Vectors', 'Addition', 'Scalar and Vector Products', 'Triple Products'] },
            { name: 'Three Dimensional Geometry', topics: ['Direction Cosines', 'Equation of Line', 'Skew Lines', 'Equation of Plane', 'Angle between Planes'] },
            { name: 'Linear Programming', topics: ['Formulation of Problems', 'Graphical Method', 'Feasible Region', 'Optimal Solution'] },
            { name: 'Probability', topics: ['Conditional Probability', "Bayes' Theorem", 'Probability Distribution', 'Binomial Distribution'] },
          ],
        },
        {
          name: 'Biology',
          emoji: '🌱',
          chapters: [
            { name: 'Reproduction in Organisms', topics: ['Asexual Reproduction', 'Sexual Reproduction', 'Life Span'] },
            { name: 'Sexual Reproduction in Flowering Plants', topics: ['Flower Structure', 'Pollen', 'Fertilisation', 'Fruit and Seed Development', 'Apomixis', 'Polyembryony'] },
            { name: 'Human Reproduction', topics: ['Male Reproductive System', 'Female Reproductive System', 'Gametogenesis', 'Fertilisation', 'Implantation', 'Parturition'] },
            { name: 'Reproductive Health', topics: ['Population Explosion', 'Contraception', 'MTP', 'STDs', 'Infertility'] },
            { name: 'Principles of Inheritance and Variation', topics: ["Mendel's Laws", 'Chromosomal Theory', 'Linkage', 'Mutations', 'Pedigree Analysis', 'Genetic Disorders'] },
            { name: 'Molecular Basis of Inheritance', topics: ['DNA Structure', 'Replication', 'Transcription', 'Translation', 'Gene Regulation', 'Human Genome Project'] },
            { name: 'Evolution', topics: ['Origin of Life', 'Theories of Evolution', 'Darwin', 'Hardy-Weinberg Principle', 'Evidence for Evolution'] },
            { name: 'Human Health and Disease', topics: ['Innate and Acquired Immunity', 'Vaccines', 'Allergies', 'Cancer', 'Drugs and Alcohol Abuse'] },
            { name: 'Strategies for Enhancement in Food Production', topics: ['Plant Breeding', 'Animal Husbandry', 'Tissue Culture', 'Biofortification'] },
            { name: 'Microbes in Human Welfare', topics: ['Microbes in Food', 'Biocontrol Agents', 'Biofertilisers', 'Sewage Treatment'] },
            { name: 'Biotechnology — Principles and Processes', topics: ['Recombinant DNA Technology', 'Tools of Biotechnology', 'PCR', 'Gel Electrophoresis'] },
            { name: 'Biotechnology and Its Applications', topics: ['BT Cotton', 'Gene Therapy', 'Molecular Diagnosis', 'Transgenic Animals', 'Ethical Issues'] },
            { name: 'Organisms and Populations', topics: ['Organism and Environment', 'Population Attributes', 'Population Growth', 'Interspecific Interactions'] },
            { name: 'Ecosystem', topics: ['Ecosystem Structure', 'Productivity', 'Decomposition', 'Energy Flow', 'Nutrient Cycling', 'Ecological Services'] },
            { name: 'Biodiversity and Conservation', topics: ['Concept of Biodiversity', 'Importance', 'Loss of Biodiversity', 'Conservation Methods'] },
            { name: 'Environmental Issues', topics: ['Air Pollution', 'Water Pollution', 'Solid Waste', 'Agro-chemicals', 'Deforestation', 'Global Warming'] },
          ],
        },
      ],
    },
  ],
};

// ─── ICSE ────────────────────────────────────────────────────────────────────

export const ICSE_CURRICULUM: BoardCurriculum = {
  board: 'ICSE',
  classes: [
    {
      classNumber: 9,
      label: 'Class 9',
      subjects: [
        {
          name: 'Physics',
          emoji: '⚛️',
          chapters: [
            { name: 'Measurements and Experimentation', topics: ['International System of Units', 'Measurement of Length', 'Vernier Callipers', 'Screw Gauge', 'Simple Pendulum'] },
            { name: 'Motion in One Dimension', topics: ['Scalar and Vector Quantities', 'Distance and Displacement', 'Velocity', 'Acceleration', 'Equations of Motion', 'Distance-Time Graph'] },
            { name: 'Laws of Motion', topics: ["Newton's Laws of Motion", 'Linear Momentum', 'Law of Conservation of Momentum', 'Rocket Propulsion'] },
            { name: 'Pressure in Fluids and Atmospheric Pressure', topics: ['Thrust and Pressure', "Pascal's Law", 'Atmospheric Pressure', 'Barometer', 'Manometer'] },
            { name: "Upthrust in Fluids, Archimedes' Principle", topics: ['Upthrust', "Archimedes' Principle", 'Relative Density', 'Flotation'] },
            { name: 'Heat and Energy', topics: ['Heat and Temperature', 'Thermal Expansion', 'Calorimetry', 'Specific Heat Capacity', 'Latent Heat'] },
            { name: 'Reflection of Light', topics: ['Laws of Reflection', 'Reflection from Plane Mirror', 'Spherical Mirrors', 'Mirror Formula', 'Magnification', 'Uses of Spherical Mirrors'] },
            { name: 'Refraction of Light', topics: ['Laws of Refraction', 'Refractive Index', 'Refraction through Glass Slab', 'Critical Angle', 'Total Internal Reflection', 'Optical Fibre'] },
            { name: 'Electricity and Magnetism', topics: ["Ohm's Law", 'Resistance', 'Series and Parallel Circuits', 'Magnetic Field', 'Electromagnets'] },
          ],
        },
        {
          name: 'Chemistry',
          emoji: '🧪',
          chapters: [
            { name: 'The Language of Chemistry', topics: ['Symbols', 'Formulae', 'Valency', 'Chemical Equations', 'Balancing Equations'] },
            { name: 'Chemical Changes and Reactions', topics: ['Types of Chemical Reactions', 'Exothermic and Endothermic', 'Reversible and Irreversible'] },
            { name: 'Water', topics: ['Physical Properties', 'Hard and Soft Water', 'Causes of Hardness', 'Removal of Hardness', 'Water Pollution'] },
            { name: 'Atomic Structure and Chemical Bonding', topics: ['Atomic Structure', 'Shells and Sub-shells', 'Ionic Bond', 'Covalent Bond'] },
            { name: 'The Periodic Table', topics: ["Dobereiner's Triads", "Newlands' Law of Octaves", "Mendeleev's Table", 'Modern Periodic Table', 'Periodicity'] },
            { name: 'Study of the First Element — Hydrogen', topics: ['Occurrence', 'Preparation', 'Properties', 'Uses'] },
            { name: 'Study of Gas Laws', topics: ["Boyle's Law", "Charles' Law", "Gay Lussac's Law", "Avogadro's Law", 'Ideal Gas Equation'] },
            { name: 'Atmospheric Pollution', topics: ['Air Pollution', 'Ozone Layer', 'Acid Rain', 'Greenhouse Effect', 'Water Pollution'] },
          ],
        },
        {
          name: 'Biology',
          emoji: '🌱',
          chapters: [
            { name: 'Basic Biology', topics: ['Cell — The Unit of Life', 'Cell Theory', 'Difference between Plant and Animal Cell', 'Mitosis and Meiosis'] },
            { name: 'Plant Physiology', topics: ['Photosynthesis', 'Nutrition in Plants', 'Transpiration', 'Absorption and Ascent of Sap'] },
            { name: 'Diversity of Life', topics: ['Five Kingdom Classification', 'Monera', 'Protoctista', 'Fungi', 'Plantae', 'Animalia'] },
            { name: 'Human Anatomy and Physiology', topics: ['Digestive System', 'Circulatory System', 'Respiratory System', 'Excretory System', 'Nervous System'] },
            { name: 'Health and Hygiene', topics: ['First Aid', 'Common Diseases', 'Microorganisms and Diseases', 'Immunity and Vaccination'] },
          ],
        },
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Rational and Irrational Numbers', topics: ['Rational Numbers', 'Irrational Numbers', 'Surds', 'Rationalisation'] },
            { name: 'Compound Interest', topics: ['Simple Interest vs Compound Interest', 'Formula', 'Depreciation', 'Growth'] },
            { name: 'Expansions', topics: ['Standard Identities', 'Application of Identities', 'Expansion of (a+b+c)²'] },
            { name: 'Factorisation', topics: ['Factor Theorem', 'Remainder Theorem', 'Factorisation of Polynomials', 'Factorisation of Quadratics'] },
            { name: 'Simultaneous Linear Equations', topics: ['Algebraic Methods', 'Graphical Method', 'Word Problems'] },
            { name: 'Indices and Logarithms', topics: ['Laws of Indices', 'Common Logarithm', 'Laws of Logarithm', 'Applications'] },
            { name: 'Triangles', topics: ['Congruency', 'Pythagorean Theorem', 'Applications'] },
            { name: 'Rectilinear Figures', topics: ['Parallelogram', 'Rhombus', 'Rectangle', 'Square', 'Trapezium'] },
            { name: 'Area and Perimeter', topics: ["Area of Triangle", "Heron's Formula", 'Area of Quadrilateral', 'Circumference and Area of Circle'] },
            { name: 'Circle', topics: ['Chord Properties', 'Arc', 'Inscribed Angles', 'Cyclic Quadrilateral'] },
            { name: 'Statistics', topics: ['Data Collection', 'Mean', 'Median', 'Mode', 'Bar Chart', 'Pie Chart', 'Histograms'] },
            { name: 'Mensuration', topics: ['Perimeter and Area of Plane Figures', 'Volume of Cube and Cuboid', 'Surface Area'] },
            { name: 'Trigonometry', topics: ['Trigonometric Ratios', 'Trigonometric Identities', 'Heights and Distances'] },
          ],
        },
        {
          name: 'History & Civics',
          emoji: '🏛️',
          chapters: [
            { name: 'The Harappan Civilisation', topics: ['Town Planning', 'Economic Life', 'Social Life', 'Decline'] },
            { name: 'The Vedic Period', topics: ['Early and Later Vedic Age', 'Social Structure', 'Economy', 'Religion'] },
            { name: 'Jainism and Buddhism', topics: ['Teachings of Mahavira', 'Teachings of Buddha', 'Spread of Buddhism', 'Decline'] },
            { name: 'The Mauryan Empire', topics: ['Chandragupta Maurya', 'Ashoka', 'Arthashastra', 'Dhamma'] },
            { name: 'Our Constitution', topics: ['Salient Features', 'Preamble', 'Fundamental Rights', 'Fundamental Duties', 'Directive Principles'] },
            { name: 'Election Commission of India', topics: ['Role and Functions', 'Model Code of Conduct', 'Electronic Voting Machines'] },
          ],
        },
      ],
    },
    {
      classNumber: 10,
      label: 'Class 10',
      subjects: [
        {
          name: 'Physics',
          emoji: '⚛️',
          chapters: [
            { name: 'Force, Work, Power and Energy', topics: ['Types of Forces', 'Moment of Force', 'Levers', 'Pulleys', 'Work', 'Power', 'Energy', 'Conservation of Energy'] },
            { name: 'Light: Refraction of Light through a Lens', topics: ['Convex and Concave Lenses', 'Rules for Image Formation', 'Lens Formula', 'Magnification', 'Power of Lens', 'Optical Instruments'] },
            { name: 'Spectrum', topics: ['Dispersion of Light', 'Electromagnetic Spectrum', 'Scattering of Light'] },
            { name: 'Sound', topics: ['Nature of Sound', 'Speed of Sound', 'Reflection of Sound', 'Echo', 'SONAR', 'Ultrasound', 'Audibility'] },
            { name: 'Electricity and Electrical Appliances', topics: ["Ohm's Law", 'Electrical Resistance', 'Series and Parallel Circuits', 'Electric Power', 'Domestic Circuits', 'Safety Devices'] },
            { name: 'Household Circuits and Safety', topics: ['Domestic Wiring', 'Short Circuit', 'Fuses', 'MCB', 'Earthing'] },
            { name: 'Electromagnetism', topics: ['Magnetic Effect of Current', 'Electromagnetic Induction', "Faraday's Law", 'AC Generator', 'Transformer'] },
            { name: 'Radioactivity', topics: ['Nuclear Structure', 'Types of Radiation', 'Properties', 'Nuclear Fission', 'Nuclear Fusion', 'Uses'] },
          ],
        },
        {
          name: 'Chemistry',
          emoji: '🧪',
          chapters: [
            { name: 'Periodic Table', topics: ['Periodicity', 'Electronic Configuration', 'Valency', 'Atomic and Ionic Radii', 'Metallic and Non-metallic Character'] },
            { name: 'Chemical Bonding', topics: ['Ionic Bonding', 'Covalent Bonding', 'Differences', 'Polar and Non-polar Covalent Bonds'] },
            { name: 'Acids, Bases and Salts', topics: ['Properties', 'pH Scale', 'Types of Salts', 'Preparation of Salts'] },
            { name: 'Analytical Chemistry', topics: ['Characteristics of Acids and Bases', 'Test for Anions and Cations', 'Identification of Gases'] },
            { name: 'Mole Concept and Stoichiometry', topics: ['Mole', 'Molar Mass', "Avogadro's Number", 'Molecular and Empirical Formula', 'Calculations'] },
            { name: 'Electrolysis', topics: ['Electrolytic Cells', 'Electrodes', 'Electroplating', 'Applications'] },
            { name: 'Metallurgy', topics: ['Occurrence of Metals', 'Extraction of Metals', 'Alloys', 'Corrosion'] },
            { name: 'Study of Compounds — Hydrogen Chloride', topics: ['Preparation', 'Properties', 'Uses', 'Tests'] },
            { name: 'Study of Compounds — Ammonia', topics: ['Preparation', 'Properties', 'Uses', 'Tests'] },
            { name: 'Study of Compounds — Nitric Acid', topics: ['Preparation', 'Properties', 'Uses', 'Tests'] },
            { name: 'Study of Compounds — Sulphuric Acid', topics: ['Preparation (Contact Process)', 'Properties', 'Uses'] },
            { name: 'Organic Chemistry', topics: ['Introduction', 'Hydrocarbons', 'Alkanes', 'Alkenes', 'Alkynes', 'Alcohols', 'Carboxylic Acids'] },
          ],
        },
        {
          name: 'Biology',
          emoji: '🌱',
          chapters: [
            { name: 'Cell Division', topics: ['Mitosis', 'Meiosis', 'Significance', 'Comparison'] },
            { name: 'Genetics', topics: ["Mendel's Experiments", 'Laws of Inheritance', 'Monohybrid Cross', 'Dihybrid Cross', 'Sex Determination'] },
            { name: 'Absorption by Roots', topics: ['Structure of Root', 'Osmosis', 'Active Transport', 'Mineral Absorption'] },
            { name: 'Transpiration', topics: ['Types of Transpiration', 'Factors Affecting', 'Importance', 'Experiments'] },
            { name: 'Photosynthesis', topics: ['Light Reactions', 'Dark Reactions', 'Factors Affecting', 'Experiments'] },
            { name: 'The Circulatory System', topics: ['Heart', 'Blood Vessels', 'Blood', 'Lymph', 'Disorders'] },
            { name: 'The Excretory System', topics: ['Kidney Structure', 'Urine Formation', 'Osmoregulation', 'Disorders', 'Dialysis'] },
            { name: 'The Nervous System', topics: ['Neurons', 'Brain', 'Spinal Cord', 'Reflex Action', 'Sense Organs'] },
            { name: 'The Endocrine System', topics: ['Hormones', 'Glands', 'Feedback Mechanism'] },
            { name: 'Reproduction in Plants', topics: ['Vegetative Propagation', 'Sexual Reproduction', 'Pollination', 'Fertilisation', 'Seed Dispersal'] },
            { name: 'Human Reproductive System', topics: ['Male and Female Systems', 'Gametogenesis', 'Fertilisation', 'Development'] },
            { name: 'Population — Explosion and Food Production', topics: ['Population Growth', 'Food Production', 'Green Revolution', 'Biofortification'] },
          ],
        },
        {
          name: 'Mathematics',
          emoji: '📐',
          chapters: [
            { name: 'Commercial Mathematics (GST, Banking)', topics: ['GST Calculation', 'Banking', 'Shares and Dividends', 'Compound Interest'] },
            { name: 'Algebra (Quadratic Equations)', topics: ['Solving Quadratic Equations', 'Nature of Roots', 'Applications'] },
            { name: 'Ratio and Proportion', topics: ['Proportion', 'Continued Proportion', 'Mean Proportion', 'Direct and Inverse Proportion'] },
            { name: 'Factorisation of Polynomials', topics: ['Factor Theorem', 'Remainder Theorem', 'Factorisation Methods'] },
            { name: 'Matrices', topics: ['Types of Matrices', 'Matrix Operations', 'Transpose', 'Inverse'] },
            { name: 'Arithmetic Progression', topics: ['General Term', 'Sum of Terms', 'Applications'] },
            { name: 'Coordinate Geometry', topics: ['Section Formula', 'Equation of Line', 'Collinearity', 'Distance Formula'] },
            { name: 'Circles', topics: ['Arc', 'Chord', 'Tangent', 'Angle in Semicircle', 'Cyclic Quadrilateral'] },
            { name: 'Constructions', topics: ['Tangents to a Circle', 'Circumscribed Circle', 'Inscribed Circle'] },
            { name: 'Trigonometry', topics: ['Identities', 'Heights and Distances', 'Angles of Elevation and Depression'] },
            { name: 'Statistics', topics: ['Mean by Different Methods', 'Median', 'Mode', 'Quartiles', 'Histograms', 'Ogive'] },
            { name: 'Probability', topics: ['Theoretical Probability', 'Events', 'Complement', 'Word Problems'] },
            { name: 'Mensuration', topics: ['Area of Sector and Segment', 'Surface Area of Cylinder, Cone, Sphere', 'Volume'] },
          ],
        },
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const ALL_CURRICULA: BoardCurriculum[] = [CBSE_CURRICULUM, ICSE_CURRICULUM];

export function getCurriculum(board: BoardType): BoardCurriculum {
  return board === 'CBSE' ? CBSE_CURRICULUM : ICSE_CURRICULUM;
}

export function getSubjects(board: BoardType, classNumber: number): CurriculumSubject[] {
  const curriculum = getCurriculum(board);
  return curriculum.classes.find(c => c.classNumber === classNumber)?.subjects ?? [];
}

export function getChapters(board: BoardType, classNumber: number, subjectName: string): CurriculumChapter[] {
  return getSubjects(board, classNumber).find(s => s.name === subjectName)?.chapters ?? [];
}
