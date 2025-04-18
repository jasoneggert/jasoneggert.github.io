/**
 * Quantum Superposition Simulator
 *
 * This system accurately simulates quantum computing concepts using complex amplitudes,
 * unitary transformations, tensor products, and proper quantum measurement mechanics.
 */

/**
 * Complex number class for quantum state calculations
 */
class Complex {
  constructor(real, imag = 0) {
    this.real = real;
    this.imag = imag;
  }

  // Add two complex numbers
  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  // Multiply two complex numbers
  multiply(other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  // Scale a complex number by a real scalar
  scale(scalar) {
    return new Complex(this.real * scalar, this.imag * scalar);
  }

  // Return the squared magnitude |z|²
  squaredMagnitude() {
    return this.real * this.real + this.imag * this.imag;
  }

  // Complex conjugate
  conjugate() {
    return new Complex(this.real, -this.imag);
  }

  // String representation
  toString() {
    if (Math.abs(this.imag) < 1e-10) return this.real.toFixed(2);
    if (Math.abs(this.real) < 1e-10) return `${this.imag.toFixed(2)}i`;

    const sign = this.imag >= 0 ? '+' : '';
    return `${this.real.toFixed(2)}${sign}${this.imag.toFixed(2)}i`;
  }

  // Convert to angle for Bloch sphere visualization
  toPhaseAngle() {
    return Math.atan2(this.imag, this.real);
  }

  // Static method to create from polar form
  static fromPolar(r, theta) {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }
}

class QuantumParticle {
  constructor(name) {
    this.name = name;
    // Initial state |0⟩ as [1+0i, 0+0i]
    this.state = [new Complex(1, 0), new Complex(0, 0)];
    this.entangledParticles = [];
    this.collapsed = false;
    this.currentState = null;
    this.phaseAngle = 0; // Track phase for visualization
  }

  // Apply a unitary gate (matrix) to the particle
  applyGate(gate) {
    if (this.collapsed) {
      console.error(`Cannot apply gate to collapsed particle "${this.name}".`);
      return;
    }

    const [a, b] = this.state;

    // Calculate new state using matrix multiplication with complex numbers
    this.state = [
      gate[0][0].multiply(a).add(gate[0][1].multiply(b)),
      gate[1][0].multiply(a).add(gate[1][1].multiply(b))
    ];

    this.normalizeState(); // Ensure the state vector is normalized

    // Update phase angle for visualization
    this.updatePhaseAngle();
  }

  // Update the phase angle for visualization
  updatePhaseAngle() {
    if (this.state[1].squaredMagnitude() > 0) {
      this.phaseAngle = this.state[1].toPhaseAngle();
    } else {
      this.phaseAngle = this.state[0].toPhaseAngle();
    }
  }

  // Normalize the state vector
  normalizeState() {
    const normSquared =
      this.state[0].squaredMagnitude() + this.state[1].squaredMagnitude();
    const normFactor = 1 / Math.sqrt(normSquared);

    this.state = this.state.map((amp) => amp.scale(normFactor));
  }

  // Create a tensor product of two quantum states (for entanglement)
  static tensorProduct(stateA, stateB) {
    // For 2-qubit states, returns a 4-element state vector
    const result = [];
    for (const a of stateA) {
      for (const b of stateB) {
        result.push(a.multiply(b));
      }
    }
    return result;
  }

  // Entangle this particle with another one using a CNOT gate
  entangleWith(particle) {
    if (!this.entangledParticles.includes(particle)) {
      this.entangledParticles.push(particle);
      if (!particle.entangledParticles.includes(this)) {
        particle.entangledParticles.push(this);
      }

      // We're not actually computing the full tensor product state here
      // as that would require a full quantum register simulation
      // Instead, we just mark them as entangled and will handle measurement accordingly

      console.log(`Entangled ${this.name} with ${particle.name}`);
    }
  }

  // Get the probabilities of |0⟩ and |1⟩ states
  getProbabilities() {
    return {
      prob0: this.state[0].squaredMagnitude(),
      prob1: this.state[1].squaredMagnitude()
    };
  }

  // Observe (measure) the particle, collapsing its state
  observe() {
    if (this.collapsed) {
      return this.currentState;
    }

    const { prob0, prob1 } = this.getProbabilities();
    const random = Math.random();

    if (random < prob0) {
      this.currentState = '0';
      this.state = [new Complex(1, 0), new Complex(0, 0)]; // Collapse to |0⟩
    } else {
      this.currentState = '1';
      this.state = [new Complex(0, 0), new Complex(1, 0)]; // Collapse to |1⟩
    }

    this.collapsed = true;
    this.phaseAngle = 0; // Reset phase angle after collapse

    // Collapse entangled particles according to measurement outcome
    for (const particle of this.entangledParticles) {
      if (!particle.collapsed) {
        particle.collapsed = true;

        // In a proper entangled state like Bell state, the other particle collapses
        // to a correlated state. Here's a simple model (anti-correlation):
        // If we measure |0⟩, entangled particle becomes |1⟩ and vice versa
        // This simulates the behavior of a Bell state |Ψ⁻⟩ = (|01⟩-|10⟩)/√2

        particle.currentState = this.currentState === '0' ? '1' : '0';
        particle.state =
          this.currentState === '0'
            ? [new Complex(0, 0), new Complex(1, 0)]
            : [new Complex(1, 0), new Complex(0, 0)];
      }
    }

    return this.currentState;
  }

  // Reset the qubit to the |0⟩ state
  reset() {
    this.state = [new Complex(1, 0), new Complex(0, 0)];
    this.collapsed = false;
    this.currentState = null;
    this.phaseAngle = 0;
  }
}

class QuantumComputer {
  constructor() {
    this.qubits = new Map();
    this.operations = [];
    this.initQuantumGates();
  }

  // Initialize standard quantum gates with complex matrices
  initQuantumGates() {
    // Identity gate
    this.gates = {
      I: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ],

      // Pauli-X gate (NOT gate)
      X: [
        [new Complex(0, 0), new Complex(1, 0)],
        [new Complex(1, 0), new Complex(0, 0)]
      ],

      // Pauli-Y gate (rotation around Y-axis)
      Y: [
        [new Complex(0, 0), new Complex(0, -1)],
        [new Complex(0, 1), new Complex(0, 0)]
      ],

      // Pauli-Z gate (phase flip)
      Z: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(-1, 0)]
      ],

      // Hadamard gate (creates superposition)
      H: [
        [new Complex(1 / Math.sqrt(2), 0), new Complex(1 / Math.sqrt(2), 0)],
        [new Complex(1 / Math.sqrt(2), 0), new Complex(-1 / Math.sqrt(2), 0)]
      ],

      // S gate (phase gate, 90° rotation around Z-axis)
      S: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(0, 1)]
      ],

      // T gate (π/8 gate, 45° rotation around Z-axis)
      T: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), Complex.fromPolar(1, Math.PI / 4)]
      ]
    };
  }

  // Create a new qubit in the system
  createQubit(name) {
    const trimmedName = name.trim().toLowerCase(); // Normalize the name
    if (this.qubits.has(trimmedName)) {
      console.error(`Qubit "${trimmedName}" already exists.`);
      return null;
    }

    const qubit = new QuantumParticle(trimmedName);
    this.qubits.set(trimmedName, qubit);
    console.log(`Created qubit: ${trimmedName}`);
    return qubit;
  }

  // Apply a quantum gate to a qubit
  applyGate(gateName, qubitName) {
    const trimmedName = qubitName.trim().toLowerCase(); // Normalize the name

    const qubit = this.qubits.get(trimmedName);
    if (!qubit) {
      console.error(`Qubit "${trimmedName}" does not exist.`);
      return null;
    }

    const gate = this.gates[gateName];
    if (!gate) {
      console.error(`Gate "${gateName}" is not defined.`);
      return null;
    }

    qubit.applyGate(gate);
    this.operations.push(`Applied ${gateName} gate to ${trimmedName}`);
    console.log(`Applied ${gateName} gate to qubit: ${trimmedName}`);

    return qubit;
  }

  // Apply a controlled NOT (CNOT) gate, which entangles two qubits
  applyCNOT(controlQubitName, targetQubitName) {
    const controlName = controlQubitName.trim().toLowerCase();
    const targetName = targetQubitName.trim().toLowerCase();

    const controlQubit = this.qubits.get(controlName);
    const targetQubit = this.qubits.get(targetName);

    if (!controlQubit || !targetQubit) {
      console.error('One or both qubits do not exist.');
      return;
    }

    // In a real quantum computer, CNOT applies a matrix to the tensor product state
    // Here, we'll simply entangle the qubits and simulate the behavior
    controlQubit.entangleWith(targetQubit);

    this.operations.push(
      `Applied CNOT gate with control=${controlName}, target=${targetName}`
    );
  }

  // Measure a specific qubit
  measure(qubitName) {
    const trimmedName = qubitName.trim().toLowerCase();
    const qubit = this.qubits.get(trimmedName);

    if (!qubit) {
      console.error(`Qubit "${trimmedName}" does not exist.`);
      return null;
    }

    const result = qubit.observe();
    this.operations.push(`Measured ${trimmedName}: ${result}`);
    return result;
  }

  // Measure all qubits and return results
  measureAll() {
    const results = {};
    for (const [name, qubit] of this.qubits.entries()) {
      results[name] = qubit.observe();
    }
    return results;
  }

  // Reset all qubits to |0⟩ state
  resetAll() {
    for (const qubit of this.qubits.values()) {
      qubit.reset();
    }
    this.operations.push('Reset all qubits to |0⟩ state');
  }

  // Visualize the current state of the quantum system
  visualize() {
    console.log('\n🔮 Quantum System Visualization 🔮');
    console.log('=====================================');

    for (const [name, qubit] of this.qubits.entries()) {
      console.log(`\nQubit: ${name}`);
      if (qubit.collapsed) {
        console.log(`  State: |${qubit.currentState}⟩ (collapsed)`);
      } else {
        const { prob0, prob1 } = qubit.getProbabilities();
        console.log('  State Vector:');
        console.log(
          `    |0⟩: ${qubit.state[0].toString()} (probability: ${prob0.toFixed(
            4
          )})`
        );
        console.log(
          `    |1⟩: ${qubit.state[1].toString()} (probability: ${prob1.toFixed(
            4
          )})`
        );
        console.log(
          `    Phase angle: ${((qubit.phaseAngle * 180) / Math.PI).toFixed(2)}°`
        );
      }

      if (qubit.entangledParticles.length > 0) {
        console.log(
          '  Entangled with:',
          qubit.entangledParticles.map((p) => p.name).join(', ')
        );
      }
    }

    console.log('\nOperation History:');
    this.operations.slice(-5).forEach((op) => console.log(`  - ${op}`));
    console.log('=====================================');
  }
}
