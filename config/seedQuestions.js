import Question from '../models/Question.js';

const sampleQuestions = [
  {
    text: "Would you rather have the ability to fly or be invisible?",
    options: { A: "Ability to fly", B: "Be invisible" },
    category: "hypothetical"
  },
  {
    text: "Would you rather always be 10 minutes late or always be 20 minutes early?",
    options: { A: "Always 10 minutes late", B: "Always 20 minutes early" },
    category: "lifestyle"
  },
  {
    text: "Would you rather eat pizza for every meal or never eat pizza again?",
    options: { A: "Pizza for every meal", B: "Never eat pizza again" },
    category: "food"
  },
  {
    text: "Would you rather watch movies at home or at the cinema?",
    options: { A: "At home", B: "At the cinema" },
    category: "entertainment"
  },
  {
    text: "Would you rather live in a big city or a small town?",
    options: { A: "Big city", B: "Small town" },
    category: "lifestyle"
  },
  {
    text: "Would you rather have unlimited money or unlimited time?",
    options: { A: "Unlimited money", B: "Unlimited time" },
    category: "hypothetical"
  },
  {
    text: "Would you rather be famous for your talent or famous for being rich?",
    options: { A: "Famous for talent", B: "Famous for being rich" },
    category: "preferences"
  },
  {
    text: "Would you rather lose the ability to speak or lose the ability to hear?",
    options: { A: "Lose ability to speak", B: "Lose ability to hear" },
    category: "hypothetical"
  },
  {
    text: "Would you rather have coffee or tea as your only hot drink?",
    options: { A: "Coffee", B: "Tea" },
    category: "food"
  },
  {
    text: "Would you rather work from home or work in an office?",
    options: { A: "Work from home", B: "Work in an office" },
    category: "lifestyle"
  },
  {
    text: "Would you rather be able to control fire or control water?",
    options: { A: "Control fire", B: "Control water" },
    category: "hypothetical"
  },
  {
    text: "Would you rather travel to the past or travel to the future?",
    options: { A: "Travel to the past", B: "Travel to the future" },
    category: "hypothetical"
  },
  {
    text: "Would you rather read books or watch TV shows?",
    options: { A: "Read books", B: "Watch TV shows" },
    category: "entertainment"
  },
  {
    text: "Would you rather have summer all year or winter all year?",
    options: { A: "Summer all year", B: "Winter all year" },
    category: "preferences"
  },
  {
    text: "Would you rather be the smartest person in the world or the happiest?",
    options: { A: "Smartest person", B: "Happiest person" },
    category: "hypothetical"
  },
  {
    text: "Would you rather have super strength or super speed?",
    options: { A: "Super strength", B: "Super speed" },
    category: "hypothetical"
  },
  {
    text: "Would you rather eat sweet food or salty food for the rest of your life?",
    options: { A: "Sweet food only", B: "Salty food only" },
    category: "food"
  },
  {
    text: "Would you rather live without music or live without movies?",
    options: { A: "Live without music", B: "Live without movies" },
    category: "entertainment"
  },
  {
    text: "Would you rather be able to speak all languages or play all instruments?",
    options: { A: "Speak all languages", B: "Play all instruments" },
    category: "hypothetical"
  },
  {
    text: "Would you rather have a rewind button or a pause button for your life?",
    options: { A: "Rewind button", B: "Pause button" },
    category: "hypothetical"
  },
  {
    text: "Would you rather always have to sing instead of speaking or dance everywhere you go?",
    options: { A: "Always sing", B: "Always dance" },
    category: "hypothetical"
  },
  {
    text: "Would you rather have the ability to read minds or predict the future?",
    options: { A: "Read minds", B: "Predict the future" },
    category: "hypothetical"
  },
  {
    text: "Would you rather never be able to eat your favorite food again or only eat your favorite food?",
    options: { A: "Never eat favorite food", B: "Only eat favorite food" },
    category: "food"
  },
  {
    text: "Would you rather be famous but poor or rich but unknown?",
    options: { A: "Famous but poor", B: "Rich but unknown" },
    category: "preferences"
  },  {
    text: "Would you rather have no internet or no air conditioning and heating?",
    options: { A: "No internet", B: "No AC/heating" },
    category: "lifestyle"
  },
  {
    text: "Would you rather be stuck in a romantic comedy or a horror movie?",
    options: { A: "Romantic comedy", B: "Horror movie" },
    category: "entertainment"
  },
  {
    text: "Would you rather have unlimited battery life on all your devices or have free WiFi wherever you go?",
    options: { A: "Unlimited battery", B: "Free WiFi everywhere" },
    category: "lifestyle"
  },  {
    text: "Would you rather be able to teleport anywhere or be able to time travel?",
    options: { A: "Teleport anywhere", B: "Time travel" },
    category: "hypothetical"
  },  {
    text: "Would you rather have a pet dragon or a pet unicorn?",
    options: { A: "Pet dragon", B: "Pet unicorn" },
    category: "hypothetical"
  },
  {
    text: "Would you rather always know when someone is lying or always get away with lying?",
    options: { A: "Know when others lie", B: "Get away with lying" },
    category: "hypothetical"
  }
];

export const seedQuestions = async () => {
  try {
    console.log('🌱 Seeding questions database...');
    
    const existingQuestions = await Question.countDocuments();
    if (existingQuestions > 0) {
      console.log(`📝 Database already has ${existingQuestions} questions`);
      return;
    }
    
    const insertedQuestions = await Question.insertMany(sampleQuestions);
    console.log(`✅ Successfully seeded ${insertedQuestions.length} questions`);
      } catch (error) {
    console.error('❌ Error seeding questions:', error);
    throw error;
  }
};
