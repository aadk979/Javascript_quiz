import React, { useState, useEffect } from "react";
import "./App.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const getDifficultyLabel = (level) => {
  switch (level) {
    case 0: return "Easy";
    case 1: return "Medium";
    case 2: return "Hard";
    default: return "Medium";
  }
};

const QuizConfiguration = ({
  config,
  setConfig,
  topicsByCategory,
  selectedCategory,
  setSelectedCategory,
  quizTimeInMinutes,
  loading,
  error,
  startQuiz,
  atLeastOneTopicSelected,
  toggleAllTopics,
  toggleCategoryTopics,
  getSelectedCountByCategory,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-teal-700">
          JavaScript Quiz Master
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="col-span-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Quiz Settings
              </h2>
              <div className="space-y-4">
                {/* Number of Questions Slider */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">
                    Number of Questions
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="7" // Keeping max low for demo/API reasons
                      className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      value={config.noQuestions}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          noQuestions: Number(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                    <span className="ml-3 bg-teal-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {config.noQuestions}
                    </span>
                  </div>
                </div>
                {/* Difficulty Buttons */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((level) => (
                      <button
                        key={level}
                        className={`py-2 px-2 rounded-lg w-auto transition ${
                          config.difficulty === level
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() =>
                          setConfig({ ...config, difficulty: level })
                        }
                        disabled={loading}
                      >
                        {getDifficultyLabel(level)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Time Limit Display */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 font-medium">
                      Time Limit
                    </label>
                    <span className="text-teal-600 font-semibold">
                      {quizTimeInMinutes} mins
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          (quizTimeInMinutes / (7 * 1.5)) * 100, // Max time based on max questions
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Topic Selection Categories */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">Topic Selection</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAllTopics(true)}
                    className="text-xs bg-teal-600 text-white px-2 py-1 rounded-md hover:bg-teal-700 transition"
                    disabled={loading}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleAllTopics(false)}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition"
                     disabled={loading}
                 >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {Object.keys(topicsByCategory).map((categoryKey) => (
                  <div
                    key={categoryKey}
                    className={`py-2 px-3 rounded-lg cursor-pointer transition ${
                      selectedCategory === categoryKey
                        ? "bg-teal-100 border-l-4 border-teal-500"
                        : "bg-gray-100 hover:bg-gray-200"
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !loading && setSelectedCategory(categoryKey)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        {topicsByCategory[categoryKey].title}
                      </span>
                      <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                        {getSelectedCountByCategory(categoryKey)}/
                        {Object.keys(topicsByCategory[categoryKey].topics).length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Topic List */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {topicsByCategory[selectedCategory]?.title || "Select Category"}
                </h2>
                <div className="flex space-x-2">
                   <button
                    onClick={() => toggleCategoryTopics(selectedCategory, true)}
                    className="text-xs bg-teal-600 text-white px-2 py-1 rounded-md hover:bg-teal-700 transition"
                    disabled={loading}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleCategoryTopics(selectedCategory, false)}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition"
                    disabled={loading}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              {/* Added scrollbar styling utility classes if needed */}
              <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 md:max-h-full overflow-y-auto pr-2">
                 {topicsByCategory[selectedCategory] ? (
                    Object.keys(topicsByCategory[selectedCategory].topics).map(
                        (topic) => (
                            <div
                                key={topic}
                                className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition"
                            >
                                <input
                                    type="checkbox"
                                    id={`topic-${topic}`}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    checked={config.topics[topic] || false}
                                    onChange={() =>
                                        setConfig({
                                            ...config,
                                            topics: {
                                                ...config.topics,
                                                [topic]: !config.topics[topic],
                                            },
                                        })
                                    }
                                    disabled={loading}
                                />
                                <label
                                    htmlFor={`topic-${topic}`}
                                    className={`ml-3 text-sm text-gray-700 flex-1 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {topic}
                                </label>
                            </div>
                        )
                    )
                ) : (
                    <p className="text-gray-500 italic">Select a category on the left.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            onClick={startQuiz}
            disabled={loading || !atLeastOneTopicSelected()}
            className={`w-full py-3 px-4 rounded-xl text-white text-lg font-semibold transition shadow-md ${
              loading || !atLeastOneTopicSelected()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 transform hover:-translate-y-1"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading Questions...
              </span>
            ) : (
              "Start Quiz"
            )}
          </button>
          {!atLeastOneTopicSelected() && !loading && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Please select at least one topic
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const QuizActive = ({
    questions,
    currentQuestion,
    answers,
    timeLeft,
    loading,
    error,
    config,
    canProceed,
    handleAnswerChange,
    setCurrentQuestion,
    handleSubmit
}) => {
   const currentQData = questions[currentQuestion];

   if (!currentQData) {
        // Handle edge case where questions array might be temporarily empty
        return (
             <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
                <p>Loading question...</p>
             </div>
        )
   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full max-w-4xl">
        {/* Header & Timer */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-teal-700">
              Question {currentQuestion + 1}/{questions.length}
            </h2>
            <p className="text-gray-500">
              Difficulty: {getDifficultyLabel(config.difficulty)}
            </p>
          </div>
          <div className="flex items-center">
             <div
              className={`px-4 py-2 rounded-lg font-medium ${
                timeLeft < 60 && timeLeft > 0
                  ? "bg-red-100 text-red-700 animate-pulse"
                   : "bg-teal-100 text-teal-700"
              }`}
            >
               <div className="flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Question & Code Snippet */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 min-h-[100px]">
          <p className="text-lg font-medium text-gray-800 mb-3">
            {currentQData.question}
          </p>
          {currentQData.codeSnippet && (
             <div className="mt-4 mb-2 text-sm rounded-lg overflow-hidden">
                 <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines={true}
                  customStyle={{ padding: "1rem", margin: 0 }}
                   codeTagProps={{ style: { fontFamily: '"Fira Code", "Fira Mono", monospace' }}}
                >
                    {currentQData.codeSnippet}
                </SyntaxHighlighter>
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          <label htmlFor="userAnswerInput" className="block mb-2 font-medium text-gray-700">
            Your Answer:
          </label>
          <input
            id="userAnswerInput"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 ease-in-out"
            value={answers[currentQuestion] || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            disabled={loading || timeLeft <= 0}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            disabled={currentQuestion === 0 || loading || timeLeft <= 0}
            onClick={() => setCurrentQuestion((prev) => prev - 1)}
            className="px-5 py-2 rounded-lg flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 text-gray-700 hover:enabled:bg-gray-300 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /> </svg>
            Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              disabled={!canProceed || loading || timeLeft <= 0}
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              className={`px-5 py-2 rounded-lg flex items-center transition shadow-sm ${
                canProceed && !loading && timeLeft > 0
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /> </svg>
            </button>
          ) : (
            <button
              disabled={!canProceed || loading || timeLeft <= 0}
              onClick={handleSubmit}
              className={`px-5 py-2 rounded-lg flex items-center transition shadow-sm ${
                 canProceed && !loading && timeLeft > 0
                   ? "bg-green-600 text-white hover:bg-green-700"
                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center w-28">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                   Checking...
                 </span>
              ) : (
                 <span className="flex items-center justify-center w-28">
                   Finish Quiz
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /> </svg>
                </span>
              )}
            </button>
          )}
        </div>

         {/* Display submit error on the quiz page if needed */}
         {error && (
             <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm">
                Error submitting answers: {error}
             </div>
         )}
         {timeLeft <= 0 && !loading && (
             <div className="mt-4 p-3 bg-orange-100 text-orange-700 rounded-lg text-center text-sm">
                Time is up! Click Finish Quiz to see your results.
             </div>
         )}

      </div>
    </div>
  );
};

const QuizResults = ({ score, detailedResults, error, restartQuiz }) => {
    const totalQuestionsForResult = detailedResults.length;
    const percentage = totalQuestionsForResult > 0 ? Math.round((score / totalQuestionsForResult) * 100) : 0;

    let performanceMessage;
    if (percentage >= 90) performanceMessage = "Outstanding! You're a JavaScript expert!";
    else if (percentage >= 70) performanceMessage = "Great job! You have strong JavaScript knowledge.";
    else if (percentage >= 50) performanceMessage = "Good effort! Keep practicing to improve.";
    else performanceMessage = "Keep learning! JavaScript takes time to master.";

    const handleExport = () => {
        const resultsToExport = {
            score,
            totalQuestions: totalQuestionsForResult,
            percentage,
            questions: Array.isArray(detailedResults) ? detailedResults.map((r) => ({
                question: r.question,
                codeSnippet: r.codeSnippet || null,
                correctAnswer: r.correctAnswer,
                userAnswer: r.userAnswer,
                isCorrect: r.isCorrect,
            })) : [],
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultsToExport, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `quiz_results_${new Date().toISOString().split("T")[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-teal-700">Quiz Results</h2>
                    {/* Display error if one occurred during submission */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Score Circle */}
                    <div className="mt-6 flex justify-center">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle className="text-gray-200 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                                {/* Progress circle */}
                                <circle
                                    className="text-teal-600 stroke-current"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (percentage / 100) * 251.2}
                                    transform="rotate(-90 50 50)"
                                ></circle>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                                <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
                                <span className="text-gray-500">{score}/{totalQuestionsForResult}</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-lg text-gray-700">{performanceMessage}</p>
                </div>

                {/* Question Review - Uses detailedResults */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Question Review</h3>
                     <div className="space-y-6 max-h-96 overflow-y-auto pr-3"> {/* Scrollable container */}
                        {/* Check if detailedResults is an array and has items */}
                         {Array.isArray(detailedResults) && detailedResults.length > 0 ? (
                            detailedResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border ${result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-gray-800 break-words mr-4 flex-1">
                                            Q{idx + 1}: {result.question}
                                        </h4>
                                        <span
                                            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${result.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                        >
                                            {result.isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                    </div>

                                    {/* Display Code Snippet if it exists in the result object */}
                                    {result.codeSnippet && (
                                         <div className="my-3 text-sm rounded-lg overflow-hidden">
                                            <SyntaxHighlighter
                                                language="javascript"
                                                style={vscDarkPlus}
                                                showLineNumbers
                                                wrapLines={true}
                                                customStyle={{ padding: "1rem", margin: 0 }}
                                                codeTagProps={{ style: { fontFamily: '"Fira Code", "Fira Mono", monospace' } }}
                                            >
                                                {result.codeSnippet}
                                            </SyntaxHighlighter>
                                        </div>
                                    )}

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* Your Answer */}
                                        <div className="bg-white p-3 rounded border border-gray-200 break-words">
                                            <p className="text-xs text-gray-500 mb-1">Your Answer:</p>
                                            <p className={`font-mono text-sm ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>
                                                {result.userAnswer || <span className="text-gray-400 italic">(No answer)</span>}
                                            </p>
                                        </div>
                                        {/* Correct Answer */}
                                        <div className="bg-white p-3 rounded border border-gray-200 break-words">
                                            <p className="text-xs text-gray-500 mb-1">Correct Answer:</p>
                                            <p className="font-mono text-sm text-green-700">
                                                {result.correctAnswer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                           <p className="text-gray-500 italic text-center">No detailed results available.</p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={restartQuiz}
                        className="py-2 px-5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow-sm"
                    >
                        New Quiz
                    </button>
                     <button
                        onClick={handleExport}
                        disabled={!Array.isArray(detailedResults) || detailedResults.length === 0}
                        className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        Export Results
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [answers, setAnswers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [quizStarted, setQuizStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [score, setScore] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("fundamentals");
    const [detailedResults, setDetailedResults] = useState([]);

    // Topics data

    /**
     * To add a topic , choose the specific category it falls under, add it and set the selection state (default as false)
     * To add a new category , add a key (Name of cat) to the root object and value of object with title value set as category title and topics set as an object with the topic name as the key and selection state (deafult as false)
     */
    const topicsByCategory = {
        fundamentals: { title: "Fundamentals", topics: { "Variables & Data Types": false, Operators: false, "Control Flow": false, Loops: false, Functions: false, Scope: false, Hoisting: false, "Type Conversion": false } },
        dataStructures: { title: "Data Structures", topics: { Arrays: false, "Array Methods": false, Objects: false, "Object Methods": false, "Maps & Sets": false, JSON: false, /*"Linked Lists": false, "Stacks & Queues": false */} }, // Commented out less common ones for brevity
        advanced: { title: "Advanced JavaScript", topics: { Closures: false, Callbacks: false, Promises: false, "Async/Await": false, "Error Handling": false, Destructuring: false, "Spread & Rest": false, "Template Literals": false } },
        es6: { title: "ES6+ Features", topics: { "Arrow Functions": false, Classes: false, Modules: false, "Default Parameters": false, "Optional Chaining": false, "Nullish Coalescing": false, /*BigInt: false, "Dynamic Imports": false */} },
        dom: { title: "DOM & Browser", topics: { "DOM Manipulation": false, "Event Handling": false, "Browser Storage": false, "Web APIs": false, "Fetch API": false, "Browser Events": false, /* "History API": false, "Web Workers": false */} },
        concepts: { title: "Advanced Concepts", topics: { "Prototypal Inheritance": false, "Functional Programming": false, "Regular Expressions": false, "Iterators & Generators": false, "Event Loop": false, /*"Memory Management": false, "Design Patterns": false, "Performance Optimization": false */} },
    };

    const [config, setConfig] = useState({
        noQuestions: 5,
        difficulty: 1, // 0: Easy, 1: Medium, 2: Hard
        topics: Object.entries(topicsByCategory).reduce((acc, [_, category]) => {
            return { ...acc, ...category.topics };
        }, {}),
    });

    const quizTimeInMinutes = Math.max(Math.round(config.noQuestions * 1.5), 5); // 1.5 mins per question, min 5 mins
    const [timeLeft, setTimeLeft] = useState(quizTimeInMinutes * 60);

    useEffect(() => {
        let timer;
        if (quizStarted && !showResults && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft <= 0 && timer) {
             clearInterval(timer);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [quizStarted, showResults, timeLeft, loading]);

    useEffect(() => {
        if (!quizStarted) {
             setTimeLeft(quizTimeInMinutes * 60);
        }
    }, [quizTimeInMinutes, quizStarted]);

    const startQuiz = async () => {
        setLoading(true);
        setError(null);
        setDetailedResults([]);
        setShowResults(false);
        setCurrentQuestion(0);
        setScore(0);

        const selectedTopics = Object.keys(config.topics)
            .filter((topic) => config.topics[topic])
            .join(", ");

        if (!selectedTopics) {
            setError("Please select at least one topic.");
            setLoading(false);
            return;
        }
        if (config.noQuestions < 1) {
             setError("Please select at least one question.");
             setLoading(false);
             return;
        }

        try {
            console.log("Fetching questions with:", { topics: selectedTopics, noQuestions: config.noQuestions, difficulty: config.difficulty }); // Debug log
            const response = await fetch("http://localhost:3000/api/get-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topics: selectedTopics,
                    noQuestions: config.noQuestions,
                    difficulty: config.difficulty,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Fetch Error Data:", errorData);
                throw new Error(errorData.error || `Failed to fetch questions (${response.status})`);
            }

            const data = await response.json();
            console.log("Received questions:", data);

            if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
                 console.error("Invalid or empty questions array received:", data.questions);
                throw new Error("No questions returned from the server for the selected criteria.");
            }
            
            if (!data.questions.every(q => q && typeof q.question === 'string' && typeof q.answer === 'string')) {
                 console.error("Questions have invalid structure:", data.questions);
                 throw new Error("Received questions in an unexpected format.");
            }


            setQuestions(data.questions);
            setAnswers(new Array(data.questions.length).fill(""));
            setTimeLeft(quizTimeInMinutes * 60);
            setQuizStarted(true);

        } catch (error) {
            console.error("Failed to fetch questions:", error);
            setError(error.message || "An unknown error occurred while fetching questions.");
             setQuizStarted(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (value) => {
        if (!loading && timeLeft > 0 && !showResults) {
            const updated = [...answers];
            updated[currentQuestion] = value;
            setAnswers(updated);
        }
    };

    const handleSubmit = async () => {
        if (loading || showResults) return;

        setLoading(true);
        setError(null);

        const dataToSend = questions.map((q, index) => ({
            question: q.question,
            codeSnippet: q.codeSnippet || null,
            answer: q.answer,
            userAnswer: answers[index] || "",
        }));

        console.log("Submitting answers:", dataToSend);

        try {
            const response = await fetch("http://localhost:3000/api/check-answers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: dataToSend }),
            });

             const resultData = await response.json();
             console.log("Received results:", resultData); 


            if (!response.ok) {
                 console.error("Check Answers Error Data:", resultData);
                throw new Error(resultData.error || `Failed to check answers (${response.status})`);
            }

            if (!resultData.results || !Array.isArray(resultData.results)) {
                console.error("Invalid results format:", resultData);
                throw new Error("Invalid response format received from the server.");
            }
            
             if (!resultData.results.every(r => r && typeof r.question === 'string' && typeof r.isCorrect === 'boolean' && typeof r.correctAnswer === 'string')) {
                console.error("Result items have invalid structure:", resultData.results);
                throw new Error("Received results in an unexpected format.");
            }

            setDetailedResults(resultData.results);
            const correctCount = resultData.results.filter((r) => r.isCorrect).length;
            setScore(correctCount);
            setShowResults(true);


        } catch (error) {
            console.error("Failed to check answers:", error);
            setError(error.message || "Failed to submit answers. Please try again.")
            setShowResults(false);
        } finally {
            setLoading(false);
        }
    };

    const atLeastOneTopicSelected = () => {
        return Object.values(config.topics).some((value) => value === true);
    };

    const toggleCategoryTopics = (category, value) => {
        if (!topicsByCategory[category]) return;
        const updatedTopics = { ...config.topics };
        Object.keys(topicsByCategory[category].topics).forEach((topic) => {
            updatedTopics[topic] = value;
        });
        setConfig({ ...config, topics: updatedTopics });
    };

    const toggleAllTopics = (value) => {
        const updatedTopics = {};
        Object.keys(config.topics).forEach((topic) => {
            updatedTopics[topic] = value;
        });
        setConfig({ ...config, topics: updatedTopics });
    };

    const getSelectedCountByCategory = (category) => {
         if (!topicsByCategory[category]) return 0; // Guard
        const categoryTopics = Object.keys(topicsByCategory[category].topics);
        // Ensure config.topics[topic] is treated as boolean
        return categoryTopics.filter((topic) => !!config.topics[topic]).length;
    };

    const restartQuiz = () => {
        setQuizStarted(false);
        setShowResults(false);
        setQuestions([]);
        setAnswers([]);
        setCurrentQuestion(0);
        setScore(0);
        setError(null);
        setLoading(false);
        setDetailedResults([]);
    };

    const canProceed = (answers[currentQuestion]?.trim().length ?? 0) > 0;

    if (showResults) {
        return (
            <QuizResults
                score={score}
                detailedResults={detailedResults}
                error={error}
                restartQuiz={restartQuiz}
            />
        );
    }

    if (quizStarted) {
        return (
            <QuizActive
                questions={questions}
                currentQuestion={currentQuestion}
                answers={answers}
                timeLeft={timeLeft}
                loading={loading}
                error={error}
                config={config}
                canProceed={canProceed}
                handleAnswerChange={handleAnswerChange}
                setCurrentQuestion={setCurrentQuestion}
                handleSubmit={handleSubmit}
            />
        );
    }

    return (
        <QuizConfiguration
            config={config}
            setConfig={setConfig}
            topicsByCategory={topicsByCategory}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            quizTimeInMinutes={quizTimeInMinutes}
            loading={loading}
            error={error}
            startQuiz={startQuiz}
            atLeastOneTopicSelected={atLeastOneTopicSelected}
            toggleAllTopics={toggleAllTopics}
            toggleCategoryTopics={toggleCategoryTopics}
            getSelectedCountByCategory={getSelectedCountByCategory}
        />
    );
};

export default App;