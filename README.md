# CollabX

> **One platform for conducting seamless, real-time technical interviews.**

## 💡 Why CollabX?

Conducting technical interviews online often requires an interviewer and candidate to use multiple disconnected tools.

A typical online coding interview might look like:

```text
Google Meet / Zoom
        ↓
Send meeting link
        ↓
Explain the coding problem verbally
        ↓
Share or send the problem separately
        ↓
Ask candidate to open a code editor
        ↓
Switch between video call and editor
        ↓
Share code / output through another medium
        ↓
Debug communication and technical issues
```

Although each individual tool works, the overall process becomes **fragmented, time-consuming, and frustrating**.

The interviewer has to manage multiple tools while explaining the problem, and the candidate has to constantly switch between the video call, coding environment, problem statement, and communication channels.

### 🚀 The Solution

**CollabX brings the entire technical interview workflow into a single platform.**

Instead of using separate applications for video communication, coding, question sharing, chat, and code execution, CollabX provides everything inside one collaborative interview environment.

```text
                    ┌───────────────────────┐
                    │        CollabX        │
                    │                       │
                    │  🎥 Video / Audio     │
                    │  💻 Code Editor       │
                    │  📝 Interview Problem │
                    │  💬 Chat              │
                    │  ⚡ Code Execution     │
                    │  🤖 AI Questions      │
                    │                       │
                    └───────────────────────┘
                              │
                              ▼
                    Seamless Interview
                         Experience
```

The goal is simple:

> **Reduce unnecessary setup and tool switching so the interviewer can focus on evaluating the candidate and the candidate can focus on solving the problem.**

---

## 🎯 What CollabX Provides

Inside a single interview room, participants can:

* 🎥 Conduct video/audio communication using **WebRTC**
* 💻 Write and collaborate on code using **Monaco Editor**
* ⚡ Execute code using a **self-hosted Piston API**
* 📝 View and work on structured coding questions
* 🤖 Generate interview questions using **Groq AI**
* 💬 Communicate through real-time chat
* 🔄 Synchronize interview-room events using **Socket.IO**
* 🔐 Authenticate securely using **JWT or Google OAuth**
* 💾 Persist important data using **MySQL**

This eliminates the need to continuously move between multiple applications during an interview.

---

## 🧑‍💼 Typical Interview Workflow

### Traditional Approach

```text
Interviewer                         Candidate

   │                                   │
   │──── Google Meet ─────────────────►│
   │                                   │
   │──── Explain Problem ─────────────►│
   │                                   │
   │──── Send/Show Question ──────────►│
   │                                   │
   │                                   │
   │                    Open IDE ◄─────│
   │                                   │
   │◄──── Share Code / Screen ─────────│
   │                                   │
   │──── Discuss Solution ────────────►│
   │                                   │
   │──── Run / Debug Code ─────────────│
   │                                   │
   ▼                                   ▼

Multiple tools + context switching + wasted time
```

### CollabX Approach

```text
             Interviewer
                  │
                  │
                  ▼
          ┌─────────────────┐
          │    CollabX      │
          │  Interview Room │
          └────────┬────────┘
                   │
       ┌───────────┼────────────┐
       │           │            │
       ▼           ▼            ▼
   Video Call   Question     Chat
    WebRTC       Panel      Socket.IO
       │           │            │
       └───────────┼────────────┘
                   │
                   ▼
             Monaco Editor
                   │
                   ▼
             Piston API
                   │
                   ▼
            Code Execution
```

Everything required for the coding interview is available within the same room.

---

## 🚀 Key Features

### 👨‍💻 Real-Time Collaborative Coding

CollabX provides a browser-based coding environment powered by **Monaco Editor**.

Participants can work within the same interview room while Socket.IO handles real-time communication and synchronization.

Key capabilities include:

* Browser-based code editing
* Multi-language programming support
* Real-time room communication
* Shared interview context
* Integrated code execution

---

### 🧑‍💼 Structured Interview Rooms

Each interview takes place inside a dedicated collaborative room.

The room brings together:

* Interviewer
* Candidate
* Coding environment
* Interview question
* Chat
* Video/audio communication
* Code execution

This creates a centralized workspace instead of requiring several independent applications.

---

### 🤖 AI-Powered Interview Question Generation

Interviewers can generate coding questions dynamically using **Groq AI with Llama 3.3 70B**.

The interviewer can select parameters such as:

```text
Topic       → Graphs
Difficulty  → Medium
Language    → Java
```

CollabX generates a structured interview question containing information such as:

* Problem title
* Difficulty
* Topic
* Description
* Examples
* Constraints
* Hints
* Starter code

The interviewer can then load the generated question into the interview room.

This removes another manual step from the interview process.

---

### 💬 Integrated Real-Time Chat

Instead of using another messaging application during an interview, CollabX provides room-based chat.

Features include:

* Real-time messaging
* Room-specific conversations
* Persistent message storage
* Chat history retrieval

Messages are stored in **MySQL**, allowing previous conversations to remain available when required.

---

### 📹 Integrated Video Communication

CollabX uses **WebRTC** for peer-to-peer audio/video communication.

The interviewer and candidate can communicate without needing a separate meeting platform for the interview.

Socket.IO is used for signaling and coordination between participants.

---

### ⚡ Integrated Code Execution

Candidates can execute code directly inside the interview environment.

CollabX uses a **self-hosted Piston API** for multi-language code execution.

```text
Candidate writes code
        ↓
       Run
        ↓
CollabX Backend
        ↓
   Piston API
        ↓
Sandboxed Execution
        ↓
Output / Error
        ↓
Candidate
```

This removes the need to open another online compiler or local IDE during the interview.

---

### 🔐 Authentication & Security

CollabX implements:

* JWT authentication
* Google OAuth
* Protected REST APIs
* JWT-based Socket.IO authentication
* Helmet security middleware
* API rate limiting

Different rate limits are applied to resource-intensive operations such as AI question generation and code execution.

---

## 🛠️ Tech Stack

| Category                | Technology             |
| ----------------------- | ---------------------- |
| Frontend                | React.js               |
| Code Editor             | Monaco Editor          |
| Backend                 | Node.js                |
| API Framework           | Express.js             |
| Real-Time Communication | Socket.IO              |
| Video / Audio           | WebRTC                 |
| Database                | MySQL                  |
| Authentication          | JWT + Google OAuth     |
| AI                      | Groq API               |
| AI Model                | Llama 3.3 70B          |
| Code Execution          | Self-hosted Piston API |
| Cloud / Infrastructure  | Microsoft Azure        |
| Deployment              | Render                 |
| Version Control         | Git & GitHub           |

---


## 🔮 Future Improvements

Potential future improvements include:

* Interview recording
* AI-powered code review
* AI-generated candidate feedback
* Interview performance analytics
* Interview reports
* Code execution history
* Multi-interviewer support

---
