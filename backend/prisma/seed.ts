import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const questions = [
  [
    "Mathematics",
    "What is 25 × 16?",
    ["350", "375", "400", "425"],
    2,
    "25 × 16 = 25 × (8 × 2) = 200 × 2 = 400.",
    "EASY",
  ],
  [
    "Mathematics",
    "If x + 7 = 19, what is x?",
    ["10", "11", "12", "13"],
    2,
    "Subtract 7 from both sides: x = 12.",
    "EASY",
  ],
  [
    "Mathematics",
    "The average of 12, 18, 24 and 30 is:",
    ["19", "20", "21", "22"],
    2,
    "Their sum is 84; 84 ÷ 4 = 21.",
    "EASY",
  ],
  [
    "Mathematics",
    "A train covers 180 km in 3 hours. Its average speed is:",
    ["50 km/h", "55 km/h", "60 km/h", "65 km/h"],
    2,
    "Speed = distance ÷ time = 180 ÷ 3 = 60 km/h.",
    "EASY",
  ],
  [
    "Mathematics",
    "What is 15% of 240?",
    ["24", "30", "36", "40"],
    2,
    "0.15 × 240 = 36.",
    "MEDIUM",
  ],
  [
    "Reasoning",
    "Find the next number: 2, 6, 12, 20, 30, ?",
    ["36", "40", "42", "44"],
    2,
    "Differences are 4, 6, 8, 10, then 12; 30 + 12 = 42.",
    "MEDIUM",
  ],
  [
    "Reasoning",
    "Book is to Reading as Fork is to:",
    ["Drawing", "Writing", "Eating", "Stirring"],
    2,
    "A book is used for reading; a fork is used for eating.",
    "EASY",
  ],
  [
    "Reasoning",
    "If SOUTH is coded as TPVUI, how is NORTH coded?",
    ["OPSUI", "OPSTI", "OQSVI", "NPSUI"],
    0,
    "Each letter is shifted forward by one: NORTH becomes OPSUI.",
    "MEDIUM",
  ],
  [
    "Reasoning",
    "Choose the odd one out.",
    ["Square", "Triangle", "Circle", "Cube"],
    3,
    "Cube is three-dimensional; the others are two-dimensional.",
    "EASY",
  ],
  [
    "Reasoning",
    "A is taller than B. B is taller than C. Who is shortest?",
    ["A", "B", "C", "Cannot say"],
    2,
    "The order is A > B > C, so C is shortest.",
    "EASY",
  ],
  [
    "English",
    "Choose the synonym of “abundant”.",
    ["Scarce", "Plentiful", "Tiny", "Empty"],
    1,
    "Abundant means plentiful or existing in large quantities.",
    "EASY",
  ],
  [
    "English",
    "Choose the correctly spelled word.",
    ["Accomodation", "Accommodation", "Acommodation", "Accommadation"],
    1,
    "The correct spelling is accommodation.",
    "MEDIUM",
  ],
  [
    "English",
    "Fill in the blank: She ___ to the library every Saturday.",
    ["go", "goes", "gone", "going"],
    1,
    "A third-person singular subject takes “goes” in the simple present.",
    "EASY",
  ],
  [
    "English",
    "Identify the passive voice sentence.",
    [
      "Ravi wrote a letter.",
      "Ravi is writing a letter.",
      "A letter was written by Ravi.",
      "Ravi writes letters.",
    ],
    2,
    "The object receives the action in the passive construction.",
    "MEDIUM",
  ],
  [
    "English",
    "The antonym of “ancient” is:",
    ["Old", "Historic", "Modern", "Past"],
    2,
    "Modern is the opposite of ancient.",
    "EASY",
  ],
  [
    "General Knowledge",
    "Which is the largest planet in our solar system?",
    ["Earth", "Saturn", "Jupiter", "Mars"],
    2,
    "Jupiter is the largest planet in the solar system.",
    "EASY",
  ],
  [
    "General Knowledge",
    "The Constitution of India came into effect on:",
    ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1950"],
    1,
    "The Constitution came into force on 26 January 1950.",
    "MEDIUM",
  ],
  [
    "General Knowledge",
    "What is the SI unit of electric current?",
    ["Volt", "Watt", "Ampere", "Ohm"],
    2,
    "The ampere is the SI base unit of electric current.",
    "EASY",
  ],
  [
    "General Knowledge",
    "Who wrote “The Discovery of India”?",
    [
      "Mahatma Gandhi",
      "B. R. Ambedkar",
      "Jawaharlal Nehru",
      "Rabindranath Tagore",
    ],
    2,
    "Jawaharlal Nehru wrote the book during his imprisonment at Ahmednagar Fort.",
    "MEDIUM",
  ],
  [
    "General Knowledge",
    "Which gas is most abundant in Earth’s atmosphere?",
    ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    1,
    "Nitrogen makes up about 78% of Earth’s atmosphere.",
    "EASY",
  ],
] as const;

const subjectNamesHi: Record<string, string> = {
  Mathematics: "गणित",
  Reasoning: "तर्कशक्ति",
  English: "अंग्रेज़ी",
  "General Knowledge": "सामान्य ज्ञान",
};

const hindiQuestions = [
  {
    text: "25 × 16 कितना है?",
    options: ["350", "375", "400", "425"],
    explanation: "25 × 16 = 25 × (8 × 2) = 200 × 2 = 400।",
  },
  {
    text: "यदि x + 7 = 19 है, तो x का मान क्या है?",
    options: ["10", "11", "12", "13"],
    explanation: "दोनों पक्षों से 7 घटाने पर x = 12 मिलता है।",
  },
  {
    text: "12, 18, 24 और 30 का औसत कितना है?",
    options: ["19", "20", "21", "22"],
    explanation: "इनका योग 84 है; 84 ÷ 4 = 21।",
  },
  {
    text: "एक ट्रेन 3 घंटे में 180 किमी चलती है। उसकी औसत गति क्या है?",
    options: ["50 किमी/घंटा", "55 किमी/घंटा", "60 किमी/घंटा", "65 किमी/घंटा"],
    explanation: "गति = दूरी ÷ समय = 180 ÷ 3 = 60 किमी/घंटा।",
  },
  {
    text: "240 का 15% कितना है?",
    options: ["24", "30", "36", "40"],
    explanation: "0.15 × 240 = 36।",
  },
  {
    text: "अगली संख्या ज्ञात करें: 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "44"],
    explanation: "अंतर 4, 6, 8, 10 और फिर 12 है; इसलिए 30 + 12 = 42।",
  },
  {
    text: "पुस्तक का संबंध पढ़ने से है, उसी प्रकार कांटे का संबंध किससे है?",
    options: ["चित्र बनाना", "लिखना", "खाना", "हिलाना"],
    explanation: "पुस्तक पढ़ने के लिए और कांटा खाने के लिए उपयोग किया जाता है।",
  },
  {
    text: "यदि SOUTH को TPVUI लिखा जाता है, तो NORTH को कैसे लिखा जाएगा?",
    options: ["OPSUI", "OPSTI", "OQSVI", "NPSUI"],
    explanation:
      "हर अक्षर को एक स्थान आगे बढ़ाया गया है; NORTH से OPSUI बनता है।",
  },
  {
    text: "भिन्न विकल्प चुनें।",
    options: ["वर्ग", "त्रिभुज", "वृत्त", "घन"],
    explanation: "घन त्रि-आयामी है; अन्य सभी द्वि-आयामी हैं।",
  },
  {
    text: "A, B से लंबा है और B, C से लंबा है। सबसे छोटा कौन है?",
    options: ["A", "B", "C", "नहीं बता सकते"],
    explanation: "क्रम A > B > C है, इसलिए C सबसे छोटा है।",
  },
  {
    text: "‘abundant’ का समानार्थी शब्द चुनें।",
    options: ["अल्प", "प्रचुर", "बहुत छोटा", "खाली"],
    explanation: "Abundant का अर्थ प्रचुर या बड़ी मात्रा में उपलब्ध होना है।",
  },
  {
    text: "सही वर्तनी वाला अंग्रेज़ी शब्द चुनें।",
    options: ["Accomodation", "Accommodation", "Acommodation", "Accommadation"],
    explanation: "सही वर्तनी Accommodation है।",
  },
  {
    text: "रिक्त स्थान भरें: She ___ to the library every Saturday.",
    options: ["go", "goes", "gone", "going"],
    explanation:
      "Simple present में third-person singular subject के साथ ‘goes’ आता है।",
  },
  {
    text: "कर्मवाच्य वाला वाक्य पहचानें।",
    options: [
      "रवि ने पत्र लिखा।",
      "रवि पत्र लिख रहा है।",
      "पत्र रवि द्वारा लिखा गया।",
      "रवि पत्र लिखता है।",
    ],
    explanation: "कर्मवाच्य वाक्य में कर्म पर क्रिया का प्रभाव पड़ता है।",
  },
  {
    text: "‘ancient’ का विलोम क्या है?",
    options: ["पुराना", "ऐतिहासिक", "आधुनिक", "भूतकाल"],
    explanation: "Modern अर्थात आधुनिक, ancient का विपरीत है।",
  },
  {
    text: "हमारे सौरमंडल का सबसे बड़ा ग्रह कौन सा है?",
    options: ["पृथ्वी", "शनि", "बृहस्पति", "मंगल"],
    explanation: "बृहस्पति सौरमंडल का सबसे बड़ा ग्रह है।",
  },
  {
    text: "भारत का संविधान किस दिन लागू हुआ?",
    options: [
      "15 अगस्त 1947",
      "26 जनवरी 1950",
      "26 नवंबर 1949",
      "2 अक्टूबर 1950",
    ],
    explanation: "भारत का संविधान 26 जनवरी 1950 को लागू हुआ।",
  },
  {
    text: "विद्युत धारा की SI इकाई क्या है?",
    options: ["वोल्ट", "वाट", "एम्पियर", "ओम"],
    explanation: "एम्पियर विद्युत धारा की SI मूल इकाई है।",
  },
  {
    text: "‘द डिस्कवरी ऑफ इंडिया’ किसने लिखी?",
    options: [
      "महात्मा गांधी",
      "डॉ. बी. आर. आंबेडकर",
      "जवाहरलाल नेहरू",
      "रवीन्द्रनाथ टैगोर",
    ],
    explanation:
      "जवाहरलाल नेहरू ने अहमदनगर किले में कारावास के दौरान यह पुस्तक लिखी।",
  },
  {
    text: "पृथ्वी के वायुमंडल में सबसे अधिक कौन सी गैस है?",
    options: ["ऑक्सीजन", "नाइट्रोजन", "कार्बन डाइऑक्साइड", "हाइड्रोजन"],
    explanation: "पृथ्वी के वायुमंडल का लगभग 78% भाग नाइट्रोजन है।",
  },
] as const;

async function main() {
  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash("Admin@123", 12),
    bcrypt.hash("Student@123", 12),
  ]);
  await prisma.roleDefinition.upsert({
    where: { code: Role.ADMIN },
    update: {},
    create: {
      code: Role.ADMIN,
      name: "Administrator",
      description: "Platform and content administrator",
    },
  });
  await prisma.roleDefinition.upsert({
    where: { code: Role.STUDENT },
    update: {},
    create: {
      code: Role.STUDENT,
      name: "Student",
      description: "Mock test participant",
    },
  });
  await prisma.user.upsert({
    where: { email: "admin@mockmaster.com" },
    update: {
      passwordHash: adminHash,
      role: { connect: { code: Role.ADMIN } },
    },
    create: {
      fullName: "MockMaster Admin",
      email: "admin@mockmaster.com",
      passwordHash: adminHash,
      role: { connect: { code: Role.ADMIN } },
    },
  });
  await prisma.user.upsert({
    where: { email: "student@mockmaster.com" },
    update: {
      passwordHash: studentHash,
      role: { connect: { code: Role.STUDENT } },
    },
    create: {
      fullName: "Demo Student",
      email: "student@mockmaster.com",
      passwordHash: studentHash,
      role: { connect: { code: Role.STUDENT } },
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "SSC" },
    update: { nameHi: "एसएससी" },
    create: {
      name: "SSC",
      nameHi: "एसएससी",
      description: "Staff Selection Commission examinations",
    },
  });
  const subjects = new Map<string, string>();
  for (const name of [
    "Mathematics",
    "Reasoning",
    "English",
    "General Knowledge",
  ]) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: { nameHi: subjectNamesHi[name] },
      create: { name, nameHi: subjectNamesHi[name] },
    });
    subjects.set(name, subject.id);
  }

  let exam = await prisma.exam.findFirst({
    where: { title: "SSC CGL Full Mock Test 01" },
  });
  if (!exam)
    exam = await prisma.exam.create({
      data: {
        title: "SSC CGL Full Mock Test 01",
        titleHi: "एसएससी सीजीएल पूर्ण मॉक टेस्ट 01",
        description:
          "A balanced full-length practice set covering quantitative aptitude, reasoning, English, and general awareness.",
        descriptionHi:
          "मात्रात्मक योग्यता, तर्कशक्ति, अंग्रेज़ी और सामान्य जागरूकता पर आधारित संतुलित पूर्ण अभ्यास परीक्षा।",
        instructions:
          "Read each question carefully. Select one answer per question. Use Mark for Review when you want to revisit a question.",
        instructionsHi:
          "हर प्रश्न को ध्यान से पढ़ें। प्रत्येक प्रश्न के लिए एक उत्तर चुनें। जिस प्रश्न पर बाद में लौटना हो, उसे समीक्षा के लिए चिह्नित करें।",
        categoryId: category.id,
        durationMinutes: 30,
        totalMarks: 40,
        marksPerQuestion: 2,
        negativeMarks: 0.5,
        difficulty: "MEDIUM",
        status: "PUBLISHED",
        publishedAt: new Date(),
        settings: {
          create: {
            randomizeQuestions: false,
            randomizeOptions: false,
            showResultImmediately: true,
            allowAnswerReview: true,
            requireExplanations: true,
            allowResume: true,
          },
        },
      },
    });

  exam = await prisma.exam.update({
    where: { id: exam.id },
    data: {
      titleHi: "एसएससी सीजीएल पूर्ण मॉक टेस्ट 01",
      descriptionHi:
        "मात्रात्मक योग्यता, तर्कशक्ति, अंग्रेज़ी और सामान्य जागरूकता पर आधारित संतुलित पूर्ण अभ्यास परीक्षा।",
      instructionsHi:
        "हर प्रश्न को ध्यान से पढ़ें। प्रत्येक प्रश्न के लिए एक उत्तर चुनें। जिस प्रश्न पर बाद में लौटना हो, उसे समीक्षा के लिए चिह्नित करें।",
    },
  });

  if ((await prisma.question.count({ where: { examId: exam.id } })) === 0) {
    const sections = new Map<string, string>();
    let sectionOrder = 1;
    for (const name of subjects.keys()) {
      const section = await prisma.examSection.create({
        data: {
          examId: exam.id,
          subjectId: subjects.get(name),
          name,
          nameHi: subjectNamesHi[name],
          order: sectionOrder++,
        },
      });
      sections.set(name, section.id);
    }
    for (const [
      index,
      [subject, text, options, correctIndex, explanation, difficulty],
    ] of questions.entries()) {
      await prisma.question.create({
        data: {
          examId: exam.id,
          sectionId: sections.get(subject),
          subjectId: subjects.get(subject),
          text,
          explanation,
          difficulty,
          marks: 2,
          negativeMarks: 0.5,
          order: index + 1,
          options: {
            create: options.map((option, optionIndex) => ({
              label: String.fromCharCode(65 + optionIndex),
              text: option,
              isCorrect: optionIndex === correctIndex,
            })),
          },
        },
      });
    }
  }

  for (const [name, nameHi] of Object.entries(subjectNamesHi)) {
    await prisma.examSection.updateMany({
      where: { examId: exam.id, name },
      data: { nameHi },
    });
  }

  for (const [index, translation] of hindiQuestions.entries()) {
    const question = await prisma.question.findUnique({
      where: { examId_order: { examId: exam.id, order: index + 1 } },
      include: { options: true },
    });
    if (!question) continue;
    await prisma.question.update({
      where: { id: question.id },
      data: {
        text: questions[index][1],
        explanation: questions[index][4],
        textHi: translation.text,
        explanationHi: translation.explanation,
      },
    });
    for (const [optionIndex, textHi] of translation.options.entries()) {
      const option = question.options.find(
        (item) => item.label === String.fromCharCode(65 + optionIndex),
      );
      if (option)
        await prisma.questionOption.update({
          where: { id: option.id },
          data: { text: questions[index][2][optionIndex], textHi },
        });
    }
  }
  console.log(
    "Seed complete: admin@mockmaster.com / Admin@123, student@mockmaster.com / Student@123",
  );
}

main().finally(() => prisma.$disconnect());
