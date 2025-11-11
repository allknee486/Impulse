# Project UML Diagrams

## Four Modeling Perspectives

### 1. Context Perspective
**External perspective modeling the context or environment of the system**

**[Use Case Diagram](use_case_diagram_simple.md)**
- Shows the 5 core features users can perform
- Illustrates the system boundary and external actors

---

### 2. Structure Perspective (Logical)
**Modeling the organization of the system or the structure of the data**

**[Class Diagram](class_diagram_simple.md)** - *Data Structure*
- Shows the 6 core data models and their relationships
- Illustrates database schema and entity relationships

**[Component Diagram](component_diagram_simple.md)** - *System Architecture*
- Shows the 3-tier architecture (Frontend, Backend, Database)
- Illustrates major components and their connections

---

### 3. Interaction Perspective
**The interactions between the system and its environment or between components**

**[Sequence Diagram](sequence_diagram_simple.md)**
- Shows the flow of recording a transaction with real-time updates
- Illustrates message passing between User, Frontend, Backend, Database, and WebSocket

---

### 4. Behavior Perspective (Functional)
**Modeling the dynamic behavior of the system and its response to events**

**[Activity Diagram](activity_diagram_simple.md)**
- Shows the complete workflow from login through transaction recording
- Illustrates decision points, system responses, and state transitions

---

## Quick Reference

| Perspective | Diagram | File | Focus |
|-------------|---------|------|-------|
| Context | Use Case | [use_case_diagram_simple.md](use_case_diagram_simple.md) | User features |
| Structure | Class | [class_diagram_simple.md](class_diagram_simple.md) | Data organization |
| Structure | Component | [component_diagram_simple.md](component_diagram_simple.md) | System architecture |
| Interaction | Sequence | [sequence_diagram_simple.md](sequence_diagram_simple.md) | Component communication |
| Behavior | Activity | [activity_diagram_simple.md](activity_diagram_simple.md) | System workflows |

---
