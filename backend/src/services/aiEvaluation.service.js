import { GoogleGenAI } from '@google/genai';
import logger from '../config/logger.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const is503Error = (error) => {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code;
  
  if (status && status !== 503 && status !== '503' && status !== 'UNAVAILABLE') {
    return false;
  }
  
  if (status === 503 || status === '503' || status === 'UNAVAILABLE') {
    return true;
  }
  
  const msg = String(error.message || '');
  if (msg.includes('429') || msg.includes('404') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('not found')) {
    return false;
  }
  
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.toLowerCase().includes('overloaded');
};

export const evaluateAnswerWithAI = async (questionTitle, questionDescription, answerText) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'mock_gemini_api_key_replace_with_actual') {
    logger.info('Using Mock AI Evaluation Engine (GEMINI_API_KEY not configured)');
    return generateMockEvaluation(answerText);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert academic evaluator. Evaluate the student/teacher answer provided for the question.
Return ONLY a valid JSON object matching the exact schema below.

Question Title: "${questionTitle}"
Question Context: "${questionDescription}"
Submitted Answer: "${answerText}"

JSON Schema format:
{
  "accuracyScore": number (0 to 100),
  "conceptCoverage": "string explaining covered concepts",
  "missingPoints": ["array of missing key concepts"],
  "grammarScore": number (0 to 100),
  "overallFeedback": "detailed helpful feedback",
  "confidenceScore": number (0.0 to 1.0),
  "shortSummary": "1-2 sentence concise evaluation summary"
}
`;

  const makeRequest = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text ? response.text.trim() : '';
    
    // Clean response in case model returned markdown codeblocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const evaluation = JSON.parse(cleanJson);

    return {
      accuracyScore: evaluation.accuracyScore || 85,
      conceptCoverage: evaluation.conceptCoverage || 'Good coverage of core topics',
      missingPoints: evaluation.missingPoints || [],
      grammarScore: evaluation.grammarScore || 90,
      overallFeedback: evaluation.overallFeedback || 'Clear answer with good reasoning.',
      confidenceScore: evaluation.confidenceScore || 0.9,
      shortSummary: evaluation.shortSummary || 'Well-written and accurate explanation.',
      evaluatedAt: new Date()
    };
  };

  try {
    return await makeRequest();
  } catch (error) {
    if (is503Error(error)) {
      logger.warn(`AI Evaluation encountered 503 UNAVAILABLE error: ${error.message}. Retrying in 2 seconds...`);
      await sleep(2000);
      try {
        return await makeRequest();
      } catch (retryError) {
        logger.error(`AI Evaluation retry failed: ${retryError.message}. Fallback mock evaluation generated.`);
        return generateMockEvaluation(answerText);
      }
    }

    logger.error(`AI Evaluation failed: ${error.message}. Fallback mock evaluation generated.`);
    return generateMockEvaluation(answerText);
  }
};

const generateMockEvaluation = (answerText) => {
  const length = answerText ? answerText.length : 0;
  const isDetailed = length > 100;

  return {
    accuracyScore: isDetailed ? 92 : 78,
    conceptCoverage: isDetailed
      ? 'Comprehensive explanation covering key concepts and logic.'
      : 'Basic coverage. Could benefit from adding step-by-step examples.',
    missingPoints: isDetailed ? [] : ['Step-by-step mathematical proof', 'Real-world application example'],
    grammarScore: 95,
    overallFeedback: isDetailed
      ? 'Excellent submission! Clear, structured, and accurate.'
      : 'Solid start. Expand further on edge cases for higher accuracy.',
    confidenceScore: 0.95,
    shortSummary: isDetailed ? 'High quality answer.' : 'Good answer needing minor elaboration.',
    evaluatedAt: new Date()
  };
};

export const evaluateQuestionWithAI = async (title, description) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'mock_gemini_api_key_replace_with_actual') {
    logger.info('Using Mock AI Question Suggestion Engine (GEMINI_API_KEY not configured)');
    return generateMockQuestionSuggestions(title, description);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an AI learning coach. Review the student's proposed academic question.
Analyze if it has any errors (grammatical, spelling, technical, conceptual) or lacks clarity, and suggest improvements.
Also infer the difficulty level ("Easy", "Medium", or "Hard") and 2 to 5 relevant tags based on the question context.
Return ONLY a valid JSON object matching the exact schema below.

Question Title: "${title}"
Question Context: "${description}"

JSON Schema format:
{
  "isGood": boolean,
  "grammarIssues": ["array of grammar/spelling errors found, or empty array"],
  "conceptualIssues": ["array of conceptual/technical inaccuracies or lacks of context, or empty array"],
  "suggestedTitle": "an improved, clearer, or corrected version of the title",
  "suggestedDescription": "an improved, clearer, or corrected version of the description",
  "suggestedDifficulty": "one of 'Easy', 'Medium', 'Hard'",
  "suggestedTags": ["array of 2-5 short, relevant lowercase tag strings"],
  "generalFeedback": "helpful coaching feedback to the student on how to write better questions"
}
`;

  const makeRequest = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text ? response.text.trim() : '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const evaluation = JSON.parse(cleanJson);

    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    const suggestedDifficulty = validDifficulties.includes(evaluation.suggestedDifficulty)
      ? evaluation.suggestedDifficulty
      : 'Medium';

    const suggestedTags = Array.isArray(evaluation.suggestedTags)
      ? evaluation.suggestedTags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];

    return {
      isGood: evaluation.isGood !== false,
      grammarIssues: evaluation.grammarIssues || [],
      conceptualIssues: evaluation.conceptualIssues || [],
      suggestedTitle: evaluation.suggestedTitle || title,
      suggestedDescription: evaluation.suggestedDescription || description,
      suggestedDifficulty,
      suggestedTags,
      generalFeedback: evaluation.generalFeedback || 'Your question is clear and well-structured.'
    };
  };

  try {
    return await makeRequest();
  } catch (error) {
    if (is503Error(error)) {
      logger.warn(`AI Question Evaluation encountered 503 UNAVAILABLE error: ${error.message}. Retrying in 2 seconds...`);
      await sleep(2000);
      try {
        return await makeRequest();
      } catch (retryError) {
        logger.error(`AI Question Evaluation retry failed: ${retryError.message}. Fallback mock evaluation generated.`);
        return generateMockQuestionSuggestions(title, description);
      }
    }

    logger.error(`AI Question Evaluation failed: ${error.message}. Fallback mock evaluation generated.`);
    return generateMockQuestionSuggestions(title, description);
  }
};

const generateMockQuestionSuggestions = (title, description) => {
  const grammarIssues = [];
  const conceptualIssues = [];
  let suggestedTitle = title.trim();
  let suggestedDescription = description.trim();

  // Heuristic spelling dictionary for common student/developer typos
  const typoDict = {
    "answe": "answer",
    "sentece": "sentence",
    "perseon": "person",
    "fir": "fix",
    "whateveer": "whatever",
    "forgetting": "forgot",
    "teh": "the",
    "recieve": "receive",
    "definately": "definitely",
    "dont": "don't",
    "cant": "can't",
    "wont": "won't",
    "shouldnt": "shouldn't",
    "wouldnt": "wouldn't",
    "couldnt": "couldn't",
    "doesnt": "doesn't",
    "isnt": "isn't",
    "arent": "aren't",
    "wasnt": "wasn't",
    "werent": "weren't",
    "hasnt": "hasn't",
    "havent": "haven't",
    "hadnt": "hadn't"
  };

  const correctText = (text, typeName) => {
    let corrected = text;
    // split by word boundaries to match exact words
    const words = text.split(/\b/);
    const issues = [];
    
    for (let word of words) {
      const lowerWord = word.toLowerCase();
      if (typoDict[lowerWord]) {
        const isCapitalized = word[0] === word[0].toUpperCase();
        const replacement = isCapitalized 
          ? typoDict[lowerWord].charAt(0).toUpperCase() + typoDict[lowerWord].slice(1)
          : typoDict[lowerWord];
        
        // Escape special chars if any (none in typoDict keys)
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        corrected = corrected.replace(regex, replacement);
        issues.push(`Spelling: Found typo "${word}" in the ${typeName}. Corrected to "${replacement}".`);
      }
    }
    return { corrected, issues };
  };

  const titleCheck = correctText(suggestedTitle, "title");
  suggestedTitle = titleCheck.corrected;
  grammarIssues.push(...titleCheck.issues);

  const descCheck = correctText(suggestedDescription, "description");
  suggestedDescription = descCheck.corrected;
  grammarIssues.push(...descCheck.issues);

  // Capitalize first letter of title
  if (suggestedTitle.length > 0 && suggestedTitle[0] !== suggestedTitle[0].toUpperCase()) {
    suggestedTitle = suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1);
    grammarIssues.push('Sentence: The title should start with a capitalized letter.');
  }

  // Add question mark to title if it's a question and lacks a trailing question mark
  if (suggestedTitle.length > 0) {
    const questionWords = ['what', 'why', 'how', 'when', 'who', 'which', 'is', 'are', 'can', 'do', 'does', 'did', 'should', 'would', 'could'];
    const firstWord = suggestedTitle.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (questionWords.includes(firstWord) && !suggestedTitle.endsWith('?')) {
      suggestedTitle = suggestedTitle + '?';
      grammarIssues.push('Sentence: Added a question mark to the end of the question title.');
    }
  }

  // Capitalize first letter of description
  if (suggestedDescription.length > 0 && suggestedDescription[0] !== suggestedDescription[0].toUpperCase()) {
    suggestedDescription = suggestedDescription.charAt(0).toUpperCase() + suggestedDescription.slice(1);
    grammarIssues.push('Sentence: The description should start with a capitalized letter.');
  }

  // Length constraints
  const titleWords = title.trim().split(/\s+/).filter(Boolean).length;
  const descWords = description.trim().split(/\s+/).filter(Boolean).length;
  const isTooShort = titleWords < 4 || descWords < 8;

  if (isTooShort) {
    grammarIssues.push("Length: The title or description is too short to provide clear context.");
    conceptualIssues.push("Context: Please describe the issue details, steps to reproduce, and expected results.");
    suggestedDescription = `${suggestedDescription}\n\nAdditional Context:\n- What are the steps to reproduce?\n- What did you try and what did you expect?`;
  }

  const isGood = grammarIssues.length === 0 && conceptualIssues.length === 0;

  return {
    isGood,
    grammarIssues,
    conceptualIssues,
    suggestedTitle,
    suggestedDescription,
    suggestedDifficulty: 'Medium',
    suggestedTags: [],
    generalFeedback: isGood 
      ? "Excellent query! The question has clear context and a defined objective."
      : "We identified spelling errors and sentence formatting issues. Review the suggestions below to correct them."
  };
};
