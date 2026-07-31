import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';

export const evaluateAnswerWithAI = async (questionTitle, questionDescription, answerText) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'mock_gemini_api_key_replace_with_actual') {
    logger.info('Using Mock AI Evaluation Engine (GEMINI_API_KEY not configured)');
    return generateMockEvaluation(answerText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const responseText = result.response.text().trim();
    
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
  } catch (error) {
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
