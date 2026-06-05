/**
 * To run this script:
 * `npm run seed:levels`
 *
 * This script will populate the `levels` collection in Firestore with the swim class level data.
 * It will overwrite any existing documents with the same ID.
 * The document IDs are stored in all lowercase to ensure case-insensitive lookups.
 */

import { db } from './firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

const levelsData = [
    {
      id: "Level 1 - Starfish (6-12 months)",
      name: "Starfish (6-12 months)",
      category: "Infants",
      skills: [
        "Understanding skill, comfort and the role of the parent or carer",
        "Safe entries and exits",
        "Supported Holds",
        "Readiness and cueing (name, ready and go)",
        "Supported vertical rotation",
        "Supported glides from one to another",
        "Use of flotation aids (supported)",
        "Safety and supervision"
      ],
      note: "Parent or Carer participation in the water"
    },
    {
      id: "Level 2 - Octopus (12-24 months)",
      name: "Octopus (12-24 months)",
      category: "Infants",
      skills: [
        "Understanding skill, comfort and the role of the parent or carer",
        "Safe entries and exits",
        "Student development - milestones on land; relating and using them in water",
        "Increased independence",
        "Improving breath control",
        "Use of flotation devices (assisted)",
        "Assisted holds",
        "Assisted submersions when ready"
      ],
      note: "Parent or Carer participation in the water"
    },
    {
      id: "Level 3 - Sea Turtle (2+ years)",
      name: "Sea Turtle (2+ years)",
      category: "Infants",
      skills: [
        "Understanding skill, comfort and the role of the parent or carer",
        "Safe entries and exits",
        "Student follows independently",
        "Independent kicking and arm action",
        "Improved buoyancy and balance skills",
        "Increased breath control",
        "Moves along wall independently",
        "Use of flotation devices (independent)",
        "Jump in and returns to the edge"
      ],
      note: "Parent or Carer participation in the water"
    },
    {
      id: "Level 4 - Seahorse (3+ years)",
      name: "Seahorse (3+ years)",
      category: "Preschool",
      skills: [
        "Practice safe entries and exits",
        "Improved Water confidence",
        "Practice front and back floating",
        "Personal water safety awareness and self-preservation",
        "Basic buoyancy, propulsion and mobility",
        "Learning breath control and personal safety",
        "Pool and water safety discussion"
      ],
      note: "Parent or Carer observing from side"
    },
    {
      id: "Level 5 - Penguin",
      name: "Penguin",
      category: "Preschool",
      skills: [
        "Independent water confidence and water familiarisation",
        "Demonstrate safe entries and exits",
        "Learning breath control and personal safety",
        "Personal water safety awareness",
        "Self-preservation skills including floating",
        "Independent buoyancy, propulsion, and mobility"
      ],
      note: "Parent or Carer observing from side"
    },
    {
      id: "Level 6 - Sea Lion",
      name: "Sea Lion",
      category: "Preschool",
      skills: [
        "Independent water confidence and water familiarisation",
        "Personal water safety awareness",
        "Self-preservation and survival skills",
        "Independent buoyancy, propulsion, and mobility",
        "Streamline body positioning",
        "Arm and leg movement toward recognisable stroke",
        "Breath control/breathing skills"
      ],
      note: "Parent or Carer observing from side"
    },
    {
      id: "Level 7 - Jellyfish",
      name: "Jellyfish",
      category: "Primary",
      skills: [
        "Increased water confidence and familiarisation",
        "Personal water safety awareness",
        "Self-preservation and survival skills - enter and return to the edge",
        "Independent buoyancy, propulsion and mobility with aids",
        "Practice streamlined body positions",
        "Demonstrate arm and leg movements working towards a recognisable stroke for freestyle and backstroke"
      ]
    },
    {
      id: "Level 8 - Platypus",
      name: "Platypus",
      category: "Primary",
      skills: [
        "Peer based lessons - working within a group/team",
        "Safety around different aquatic environments including the home and public pools",
        "Introduce rescue safety - self-preservation",
        "Jump into deep water and return to the edge",
        "Balance & rotation - body awareness",
        "Submerge and retrieve an object from the bottom"
      ]
    },
    {
      id: "Level 9 - Seal",
      name: "Seal",
      category: "Primary",
      skills: [
        "Awareness of two safe entries & exits",
        "Knowledge of pool area and other aquatic environments",
        "Personal water safety awareness",
        "Simulated open water experience",
        "Self-preservation",
        "Fit a life jacket - enter the water and float then exit",
        "Surface dive and recover an object from deep water 1.2 - 1.5m",
        "Sitting dive followed by push and glide steering up"
      ]
    },
    {
      id: "Level 10 - Marlin",
      name: "Marlin",
      category: "Primary",
      skills: [
        "Entry and exits relevant to a pool",
        "Develop an awareness of aquatic environments and describe the characteristics of each",
        "Explore body rotation / balance",
        "Recover an object from deep water without goggles",
        "Body awareness - freestyle and backstroke patterns",
        "Safe crouching dive",
        "Self-preservation skills"
      ]
    },
    {
      id: "Level 11 - Shark",
      name: "Shark",
      category: "Primary",
      skills: [
        "Introduction to the patterns for breaststroke and butterfly",
        "Aware of use and personal safety elements of a compact jump entry",
        "Aware of rescue sequences & capable of selecting an appropriate rescue aid",
        "Aware of personal safety & risk elements associated with peer pressure",
        "Self-preservation skills",
        "Swim wearing long pants and a long sleeve shirt"
      ]
    },
    {
      id: "Level 12 - Orca",
      name: "Orca",
      category: "Primary",
      skills: [
        "Aware of the timing for swimming breaststroke and butterfly",
        "Aware of a range of open water environments, common activities, as well as risk & personal safety aspects",
        "Awareness of personal competence",
        "Aware of demands and impact to personal competency for a range of open water environments",
        "Can articulate knowledge and understanding of rips and currents, and what to do if ever stuck in a rip current",
        "Swim an individual medley"
      ]
    },
    {
      id: "Level 13 - GOswim Academy 1",
      name: "GOswim Academy 1",
      category: "GOswim Academy",
      skills: [
        "Demonstrate different water entry and exit methods based on different scenario and water environment",
        "Practice being able to swim different strokes at different speeds. Work out which stroke and speed is required to get to a finishing point in a desired time",
        "Practice being in a position of danger, be able to analyse the surroundings and select the method to navigate obstacles in order to reach a point of safety",
        "Be able to reflect on their own current level of competency and be able to select a target that is attainable within the selected timeframe, with a knowledge of how to achieve it."
      ]
    },
    {
      id: "Level 14 - GOswim Academy 2",
      name: "GOswim Academy 2",
      category: "GOswim Academy",
      skills: [
        "Develop the ability to recognise their current endurance level for each stroke and therefore be able to suitably select a stroke in which to swim to reach the desired destination",
        "Practice using an aquatic skill that can be converted or utilised in another aquatic discipline (e.g. water polo)",
        "Practice performing racing skills. Understanding the rules for the event and how to best to maximise their own performance",
        "Be able to analyse their own current swimming ability and select an area of improvement with an understanding of how to achieve it.",
        "Swim 400m using a variety of nominated strokes"
      ]
    }
  ];

async function seedLevels() {
  const levelsCollection = collection(db, 'levels');
  const batch = writeBatch(db);

  levelsData.forEach((level) => {
    // Use the full descriptive name as the ID, converted to lowercase for consistency.
    const docId = level.id.toLowerCase();
    const docRef = doc(levelsCollection, docId);
    
    // We don't need to store the id field in the document itself.
    const { id, ...levelData } = level;
    batch.set(docRef, levelData);
  });

  try {
    await batch.commit();
    console.log(`Successfully seeded ${levelsData.length} levels.`);
  } catch (error) {
    console.error('Error seeding levels:', error);
  }
}

// This check ensures the script only runs when executed directly from the command line
if (require.main === module) {
  seedLevels();
}
