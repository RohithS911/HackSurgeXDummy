import './AgentProcessingOverlay.css';

const STEPS = [
  { id: 1, icon: '📷', label: 'Capturing Photo' },
  { id: 2, icon: '🔬', label: 'Analyzing Soil' },
  { id: 3, icon: '📝', label: 'Generating Report' },
  { id: 4, icon: '🔊', label: 'Preparing Audio' },
  { id: 5, icon: '✅', label: 'Displaying Results' },
];

function AgentProcessingOverlay({ currentStep, message }) {
  return (
    <div className="agent-overlay">
      <div className="agent-overlay-content">

        {/* Animated soil icon */}
        <div className="agent-hero">
          <div className="agent-soil-ring">
            <div className="agent-soil-inner">🌱</div>
          </div>
          <div className="agent-ripple r1" />
          <div className="agent-ripple r2" />
          <div className="agent-ripple r3" />
        </div>

        <h2 className="agent-title">AI Analyzing Your Soil</h2>
        <p className="agent-message">{message || 'Please wait...'}</p>

        {/* Step tracker */}
        <div className="agent-steps">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={`agent-step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="agent-step-icon">
                  {isDone ? '✓' : step.icon}
                </div>
                <span className="agent-step-label">{step.label}</span>
                {isActive && <div className="agent-step-spinner" />}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="agent-progress-track">
          <div
            className="agent-progress-fill"
            style={{ width: `${Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100)}%` }}
          />
        </div>
        <p className="agent-progress-label">Step {currentStep} of {STEPS.length}</p>
      </div>
    </div>
  );
}

export default AgentProcessingOverlay;
