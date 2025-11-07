import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, X, RotateCcw } from 'lucide-react';

export default function IOSBaselineAssessment() {
  const [stage, setStage] = useState('welcome');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [selectedValue, setSelectedValue] = useState(null);
  const [bctActive, setBctActive] = useState(false);
  const [bctTime, setBctTime] = useState(180);
  const [bctBreaths, setBctBreaths] = useState(0);
  const [bctCycles, setBctCycles] = useState(0);
  const [bctScore, setBctScore] = useState(0);
  const [results, setResults] = useState(null);
  const timerRef = useRef(null);

  const sections = [
    {
      id: 'calm_core',
      name: 'Calm Core Assessment',
      domain: 'Regulation',
      description: 'Measuring your nervous system\'s baseline stress and regulatory capacity',
      questions: [
        { text: 'In the past week, how often have you felt unable to control important things in your life?', scale: 'frequency' },
        { text: 'In the past week, how often have you felt confident about your ability to handle personal problems?', scale: 'frequency', reverse: true },
        { text: 'In the past week, how often have you felt that things were going your way?', scale: 'frequency', reverse: true },
        { text: 'In the past week, how often have you felt difficulties piling up so high you could not overcome them?', scale: 'frequency' }
      ],
      scaleLabels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
    },
    {
      id: 'observer_index',
      name: 'Observer Index',
      domain: 'Awareness',
      description: 'Assessing your capacity for meta-awareness and cognitive decentering',
      questions: [
        { text: 'I am able to separate myself from my thoughts and feelings', scale: 'agreement' },
        { text: 'I can observe unpleasant feelings without getting caught up in them', scale: 'agreement' },
        { text: 'I am able to see my thoughts as mental events rather than facts', scale: 'agreement' },
        { text: 'I can notice when my mind wanders without getting lost in thought', scale: 'agreement' },
        { text: 'I experience my thoughts as separate from who I am', scale: 'agreement' },
        { text: 'I can watch my feelings without being swept away by them', scale: 'agreement' },
        { text: 'I am able to see my experiences from a distance', scale: 'agreement' }
      ],
      scaleLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
    },
    {
      id: 'vitality_index',
      name: 'Vitality Index',
      domain: 'Outlook',
      description: 'Measuring your baseline emotional tone and life satisfaction',
      questions: [
        { text: 'Over the past two weeks, I have felt cheerful and in good spirits', scale: 'frequency' },
        { text: 'Over the past two weeks, I have felt calm and relaxed', scale: 'frequency' },
        { text: 'Over the past two weeks, I have felt active and vigorous', scale: 'frequency' },
        { text: 'Over the past two weeks, I woke up feeling fresh and rested', scale: 'frequency' },
        { text: 'Over the past two weeks, my daily life has been filled with things that interest me', scale: 'frequency' }
      ],
      scaleLabels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
    },
    {
      id: 'focus_diagnostic',
      name: 'Focus Diagnostic',
      domain: 'Attention',
      description: 'Evaluating sustained attention and mind-wandering patterns',
      questions: [
        { text: 'I find my thoughts wandering spontaneously', scale: 'frequency' },
        { text: 'When I\'m working, I find myself thinking about things unrelated to the task', scale: 'frequency' },
        { text: 'I have difficulty maintaining focus on simple or repetitive tasks', scale: 'frequency' },
        { text: 'While reading, I find I haven\'t been thinking about the text', scale: 'frequency' },
        { text: 'I do things without paying full attention', scale: 'frequency' }
      ],
      scaleLabels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
    }
  ];

  const section = sections[currentSection];
  const question = section?.questions[currentQuestion];

  // BCT Timer
  useEffect(() => {
    if (bctActive && bctTime > 0) {
      timerRef.current = setInterval(() => {
        setBctTime(prev => {
          if (prev <= 1) {
            completeBCT(180);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [bctActive, bctTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponse = (value) => {
    setSelectedValue(value);
  };

  const handleNext = () => {
    // Store response
    const key = `${section.id}_q${currentQuestion}`;
    setResponses(prev => ({
      ...prev,
      [key]: {
        value: selectedValue,
        reverse: question.reverse || false
      }
    }));

    // Move to next question or section
    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedValue(null);
    } else {
      // Section complete
      if (currentSection < sections.length - 1) {
        setCurrentSection(prev => prev + 1);
        setCurrentQuestion(0);
        setSelectedValue(null);
      } else {
        // All regular sections complete, move to BCT
        setStage('bct_intro');
      }
    }
  };

  const startBCT = () => {
    setBctActive(true);
    setStage('bct_active');
    setBctTime(180);
    setBctBreaths(0);
    setBctCycles(0);
  };

  const handleBreath = () => {
    if (bctBreaths < 8) {
      setBctBreaths(prev => prev + 1);
    } else {
      // Miscount - pressed breath after 8
      completeBCT(180 - bctTime, 'Miscount: Pressed breath after 8');
    }
  };

  const handleCompleteCycle = () => {
    if (bctBreaths === 8) {
      // Correct!
      setBctCycles(prev => prev + 1);
      setBctBreaths(0);
    } else {
      // Wrong count
      completeBCT(180 - bctTime, `Miscount: Completed at breath ${bctBreaths}`);
    }
  };

  const handleLostCount = () => {
    completeBCT(180 - bctTime, 'Self-reported: Lost count');
  };

  const completeBCT = (elapsedSeconds, reason = 'Perfect! Completed full 3 minutes') => {
    clearInterval(timerRef.current);
    setBctActive(false);
    const score = (elapsedSeconds / 180) * 5;
    setBctScore(score);
    
    // Calculate final results
    calculateResults(elapsedSeconds, score);
  };

  const calculateResults = async (bctElapsed, bctScore) => {
    // Calculate scores for each section
    const sectionScores = {};
    
    sections.forEach(section => {
      let sum = 0;
      let count = 0;
      
      section.questions.forEach((q, idx) => {
        const key = `${section.id}_q${idx}`;
        const response = responses[key];
        if (response) {
          let value = response.value;
          // Reverse scoring if needed
          if (response.reverse) {
            value = 4 - value;
          }
          sum += value;
          count++;
        }
      });
      
      // Convert to 0-5 scale
      const rawScore = sum / count;
      sectionScores[section.id] = rawScore;
    });

    // Add BCT score
    sectionScores.presence_test = bctScore;

    // Calculate domain scores (0-5 scale)
    const domainScores = {
      regulation: sectionScores.calm_core,
      awareness: sectionScores.observer_index,
      outlook: sectionScores.vitality_index,
      attention: (sectionScores.focus_diagnostic + sectionScores.presence_test) / 2
    };

    // Calculate REwired Index (0-100 scale)
    const sum = Object.values(domainScores).reduce((a, b) => a + b, 0);
    const average = sum / 4;
    const rewiredIndex = Math.round(average * 20);

    // Determine tier
    let tier = '';
    if (rewiredIndex >= 81) tier = 'Integrated (Embodied)';
    else if (rewiredIndex >= 61) tier = 'Optimized (Coherent)';
    else if (rewiredIndex >= 41) tier = 'Operational (Stabilizing)';
    else if (rewiredIndex >= 21) tier = 'Baseline Mode (Installing...)';
    else tier = 'System Offline (Critical)';

    const resultsData = {
      domainScores,
      rewiredIndex,
      tier,
      bctElapsed,
      bctScore,
      timestamp: new Date().toISOString()
    };

    // Store all data
    await storeBaselineData(sectionScores, resultsData);

    setResults(resultsData);
    setStage('results');
  };

  const storeBaselineData = async (sectionScores, resultsData) => {
    try {
      // Store individual section scores
      await window.storage.set('ios:baseline:calm_core', JSON.stringify(sectionScores.calm_core));
      await window.storage.set('ios:baseline:observer_index', JSON.stringify(sectionScores.observer_index));
      await window.storage.set('ios:baseline:vitality_index', JSON.stringify(sectionScores.vitality_index));
      await window.storage.set('ios:baseline:focus_diagnostic', JSON.stringify(sectionScores.focus_diagnostic));
      await window.storage.set('ios:baseline:presence_test', JSON.stringify(sectionScores.presence_test));
      
      // Store domain scores
      await window.storage.set('ios:baseline:domain_scores', JSON.stringify(resultsData.domainScores));
      
      // Store REwired Index
      await window.storage.set('ios:baseline:rewired_index', JSON.stringify(resultsData.rewiredIndex));
      await window.storage.set('ios:baseline:tier', JSON.stringify(resultsData.tier));
      
      // Store timestamp
      await window.storage.set('ios:baseline:date', JSON.stringify(resultsData.timestamp));
      
      // Mark system as initialized
      await window.storage.set('ios:system_initialized', JSON.stringify(true));
      
      // Initialize stage tracking
      await window.storage.set('ios:current_stage', JSON.stringify(1));
      await window.storage.set('ios:stage_start_date', JSON.stringify(resultsData.timestamp));
      await window.storage.set('ios:weekly_deltas', JSON.stringify([]));
      
      console.log('✅ Baseline data stored successfully');
    } catch (error) {
      console.error('❌ Error storing baseline data:', error);
    }
  };

  // Render functions
  if (stage === 'welcome') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <img 
              src="https://framerusercontent.com/images/OMKXvoLx7cfTffhoTiZXpSVhX8.png?scale-down-to=512" 
              alt="IOS Logo" 
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-4xl font-bold mb-4">IOS BASELINE ASSESSMENT</h1>
            <p className="text-gray-400 text-lg mb-8">
              Welcome to your neural and mental transformation diagnostic.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-300 mb-6">
              This 8-minute assessment establishes your starting point across four core domains:
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                <div>
                  <span className="font-semibold">Regulation</span>
                  <span className="text-gray-400"> - nervous system stability</span>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                <div>
                  <span className="font-semibold">Awareness</span>
                  <span className="text-gray-400"> - meta-cognitive capacity</span>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                <div>
                  <span className="font-semibold">Outlook</span>
                  <span className="text-gray-400"> - emotional baseline</span>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                <div>
                  <span className="font-semibold">Attention</span>
                  <span className="text-gray-400"> - sustained focus ability</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Answer honestly - there are no wrong answers. This establishes your transformation starting point.
            </p>
          </div>

          <button
            onClick={() => setStage('assessment')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            Begin Assessment
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'assessment') {
    const progress = ((currentQuestion + 1) / section.questions.length) * 100;
    const overallProgress = ((currentSection * 100 + progress) / (sections.length * 100)) * 100;

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Overall Progress</span>
              <span>Section {currentSection + 1} of {sections.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Section Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{section.name}</h2>
              <span className="text-orange-500 text-sm font-semibold">{section.domain}</span>
            </div>
            <p className="text-gray-400 text-sm">{section.description}</p>
          </div>

          {/* Question Card */}
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-4">
                Question {currentQuestion + 1} of {section.questions.length}
              </div>
              <p className="text-xl mb-8">{question.text}</p>
            </div>

            {/* Response Options */}
            <div className="space-y-3 mb-8">
              {section.scaleLabels.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => handleResponse(idx)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedValue === idx
                      ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    {selectedValue === idx && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Section Progress */}
            <div className="mb-6">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={selectedValue === null}
              className={`w-full py-4 px-6 rounded-lg font-bold transition-colors ${
                selectedValue !== null
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentQuestion < section.questions.length - 1 ? 'Next Question' : 
               currentSection < sections.length - 1 ? 'Continue to Next Section' : 'Complete Section'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'bct_intro') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Presence Test</h2>
              <p className="text-orange-500 font-semibold">Section 5 of 5 - Final Assessment</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Instructions:</h3>
              <ol className="space-y-3 text-gray-300">
                <li className="flex">
                  <span className="font-bold text-orange-500 mr-3">1.</span>
                  <span>Count breaths <strong>1 through 8</strong> silently in your mind</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-orange-500 mr-3">2.</span>
                  <span>Press <strong>"Next Breath"</strong> for each breath (1-8)</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-orange-500 mr-3">3.</span>
                  <span>After breath 8, press <strong>"Complete Cycle"</strong> to mark breath 9</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-orange-500 mr-3">4.</span>
                  <span>Immediately start a new cycle (count restarts at 1)</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-orange-500 mr-3">5.</span>
                  <span>If you lose count, press <strong>"Lost Count"</strong></span>
                </li>
              </ol>
            </div>

            <div className="bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-300">
                <strong>Note:</strong> The test runs for 3 minutes. One mistake ends the test. 
                This measures your sustained attention capacity.
              </p>
            </div>

            <button
              onClick={startBCT}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start 3-Minute Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'bct_active') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800 rounded-lg p-8">
            {/* Timer */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-orange-500 mb-2">
                {formatTime(bctTime)}
              </div>
              <div className="text-gray-400">Time Remaining</div>
            </div>

            {/* Cycles Counter */}
            <div className="text-center mb-8">
              <div className="text-4xl font-bold mb-2">{bctCycles}</div>
              <div className="text-gray-400">Cycles Completed</div>
            </div>

            {/* Instructions */}
            <div className="text-center mb-8">
              <div className="text-gray-400 text-lg mb-2">
                Count breaths 1-8 internally
              </div>
              <div className="text-sm text-gray-500">
                One mistake ends the test
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleBreath}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-8 px-6 rounded-lg transition-all text-xl active:scale-95"
              >
                Next Breath
                <div className="text-sm font-normal mt-1 opacity-90">Press for breaths 1-8</div>
              </button>

              <button
                onClick={handleCompleteCycle}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-8 px-6 rounded-lg transition-all text-xl active:scale-95"
              >
                Complete Cycle
                <div className="text-sm font-normal mt-1 opacity-90">Press after breath 8 (marks breath 9)</div>
              </button>

              <button
                onClick={handleLostCount}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-6 rounded-lg transition-all active:scale-95"
              >
                Lost Count
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'results' && results) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Baseline Assessment Complete</h1>
            <p className="text-gray-400">Your transformation starting point has been established</p>
          </div>

          {/* REwired Index */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-8 mb-6 text-center">
            <div className="text-sm font-semibold text-orange-100 mb-2">REwired Index</div>
            <div className="text-7xl font-bold mb-2">{results.rewiredIndex}</div>
            <div className="text-xl font-semibold text-orange-100">{results.tier}</div>
          </div>

          {/* Domain Scores */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">Domain Breakdown</h2>
            <div className="space-y-6">
              {Object.entries(results.domainScores).map(([domain, score]) => (
                <div key={domain}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold capitalize">{domain}</span>
                    <span className="text-orange-500">{score.toFixed(1)}/5.0</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What This Means */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">What This Means</h2>
            <p className="text-gray-300 mb-4">
              Your REwired Index of <strong className="text-orange-500">{results.rewiredIndex}</strong> represents 
              your current baseline across nervous system regulation, meta-awareness, emotional outlook, and sustained attention.
            </p>
            <p className="text-gray-300">
              This isn't good or bad - it's simply your starting point. The IOS is designed to systematically 
              upgrade each domain through progressive stage unlocks.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">What's Next</h2>
            <p className="text-gray-300 mb-4">
              You'll now begin <strong>Stage 1: Neural Priming</strong> - where you'll install two daily 
              practices that teach your nervous system to regulate and your mind to rest in awareness.
            </p>
            <p className="text-gray-300">
              Track your progress, and when you demonstrate competence (≥80% adherence + delta improvement), 
              you'll unlock the next stage.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/chat'}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            Continue to System Installer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
