import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface VideoScene {
  id: number;
  duration: number;
  type: 'concept' | 'diagram' | 'definition' | 'example' | 'summary';
  title?: string;
  visual: string;
  text?: string;
  equation?: string;
  labels?: string[];
  narrationStart: number;
  narrationEnd: number;
}

export interface VideoBlueprint {
  totalDuration: number;
  targetLevel: string;
  scenes: VideoScene[];
  fullNarration: string;
}

/**
 * STEP 1 & 2: Generate scene plan from content using Gemini
 */
export async function generateSceneBlueprint(
  content: string,
  topic: string,
  options: {
    durationMinutes: number;
    level: 'elementary' | 'high-school' | 'college' | 'adult';
    withVoice: boolean;
  }
): Promise<VideoBlueprint> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const { durationMinutes, level } = options;
  const totalSeconds = durationMinutes * 60;

  console.log('═══════════════════════════════════════════════');
  console.log('🎬 STEP 1-2: GENERATING VIDEO BLUEPRINT');
  console.log('═══════════════════════════════════════════════');
  console.log(`Topic: ${topic}`);
  console.log(`Duration: ${durationMinutes} minutes (${totalSeconds} seconds)`);
  console.log(`Level: ${level}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an educational video designer. Create a detailed scene plan for a ${durationMinutes}-minute educational video about "${topic}".

Target audience: ${level} students

CONTENT TO BASE VIDEO ON:
${content}

Generate a JSON blueprint with 8-12 scenes. Each scene should be 20-40 seconds.

Scene types:
- "concept": Main idea with text overlay
- "diagram": Educational diagram (chemical equations, processes, structures)
- "definition": Key term definition
- "example": Real-world example
- "summary": Recap key points

For diagram scenes, specify:
- visual: What diagram to generate (e.g., "chloroplast_structure", "chemical_equation")
- labels: Key parts to label (for structures)
- equation: Chemical/math equation (if applicable)

Return ONLY valid JSON (no markdown, no explanation):
{
  "totalDuration": ${totalSeconds},
  "scenes": [
    {
      "id": 1,
      "duration": 30,
      "type": "concept",
      "title": "Introduction Title",
      "visual": "topic_overview",
      "text": "Brief engaging introduction text"
    },
    {
      "id": 2,
      "duration": 35,
      "type": "diagram",
      "visual": "main_process_diagram",
      "labels": ["component1", "component2"],
      "equation": "relevant equation if applicable"
    }
  ]
}

Generate the blueprint now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse scene blueprint JSON');
    }

    const blueprint = JSON.parse(jsonMatch[0]);
    
    // Calculate narration timing for each scene
    let cumulativeTime = 0;
    blueprint.scenes = blueprint.scenes.map((scene: any) => ({
      ...scene,
      narrationStart: cumulativeTime,
      narrationEnd: cumulativeTime + scene.duration,
      ...{ cumulativeTime: (cumulativeTime += scene.duration) && undefined }
    }));

    console.log(`✅ Generated ${blueprint.scenes.length} scenes`);
    console.log(`   Total duration: ${blueprint.totalDuration} seconds`);

    return blueprint;
  } catch (error: any) {
    console.error('❌ Blueprint generation error:', error.message);
    throw error;
  }
}

/**
 * STEP 3: Generate full narration and time-sync with scenes
 */
export async function generateNarration(
  blueprint: VideoBlueprint,
  topic: string,
  level: string
): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('🎤 STEP 3: GENERATING NARRATION');
  console.log('═══════════════════════════════════════════════');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Build scene descriptions for context
  const sceneDescriptions = blueprint.scenes.map(scene => 
    `Scene ${scene.id} (${scene.duration}s): ${scene.type} - ${scene.title || scene.visual}`
  ).join('\n');

  const prompt = `Generate a ${Math.ceil(blueprint.totalDuration / 60)}-minute educational narration about "${topic}" for ${level} level.

The narration will be split across these scenes:
${sceneDescriptions}

Requirements:
- Natural, conversational tone
- Exactly ${blueprint.totalDuration} seconds worth of speech (~${Math.floor(blueprint.totalDuration * 2.5)} words at 150 wpm)
- Flow smoothly from scene to scene
- NO visual cues, stage directions, or markers
- Just pure spoken narration

Generate the complete narration:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let narration = response.text();

    // Clean up
    narration = narration
      .replace(/\[.*?\]/g, '')
      .replace(/^#+\s+/gm, '')
      .trim();

    const wordCount = narration.split(/\s+/).length;
    console.log(`✅ Narration generated: ${narration.length} chars, ${wordCount} words`);

    return narration;
  } catch (error: any) {
    console.error('❌ Narration generation error:', error.message);
    throw error;
  }
}

/**
 * STEP 4: Generate diagram prompts for DALL-E or educational diagram API
 */
export function generateDiagramPrompts(blueprint: VideoBlueprint, topic: string): Map<string, string> {
  const prompts = new Map<string, string>();

  blueprint.scenes.forEach(scene => {
    if (scene.type === 'diagram') {
      let prompt = `Educational ${topic} diagram, `;
      
      prompt += scene.visual.replace(/_/g, ' ') + ', ';
      
      if (scene.labels && scene.labels.length > 0) {
        prompt += `labeled with ${scene.labels.join(', ')}, `;
      }
      
      if (scene.equation) {
        prompt += `showing equation ${scene.equation}, `;
      }
      
      prompt += 'flat vector style, white background, clear arrows, textbook quality, educational illustration';
      
      prompts.set(`scene-${scene.id}`, prompt);
    }
  });

  console.log(`✅ Generated ${prompts.size} diagram prompts`);
  return prompts;
}

/**
 * Calculate optimal scene timing
 */
export function optimizeSceneTiming(
  scenes: VideoScene[],
  totalDuration: number
): VideoScene[] {
  const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  
  if (Math.abs(totalSceneDuration - totalDuration) > 5) {
    console.warn(`⚠️ Scene duration mismatch: ${totalSceneDuration}s vs ${totalDuration}s target`);
    
    // Proportionally adjust all scenes
    const ratio = totalDuration / totalSceneDuration;
    scenes = scenes.map(scene => ({
      ...scene,
      duration: Math.round(scene.duration * ratio)
    }));
  }

  // Recalculate narration timing
  let cumulative = 0;
  return scenes.map(scene => ({
    ...scene,
    narrationStart: cumulative,
    narrationEnd: cumulative + scene.duration,
    ...{ cumulative: (cumulative += scene.duration) && undefined }
  }));
}
