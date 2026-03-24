# Business Presentation Script — Part 1: Business View (~4 min)

> Structure: What problem does it solve? -> Why is the model useful or valuable? -> How could it be integrated?

---

## OPENING + Slide 1 — Title (25 sec)

> "Good morning. We are Group 3. I want to start with a question.
>
> Imagine a patient with diabetes. They've just spent five days in hospital, they're discharged, and three weeks later they're back with the same condition. Preventable, yet still costly for everyone involved.
>
> What if you had known, at the moment they walked out the door, that this was going to happen? That is the problem we decided to solve."

---

## QUESTION 1 — What problem does it solve?

### Slides 2 & 3 — The Scale of the Problem (40 sec)

> "This is not a rare case. 1 in 5 Medicare patients returns to hospital within 30 days of discharge. Across the US healthcare system, that comes to $26 billion a year.
>
> And hospitals don't just absorb the care cost. They face a penalty on top of it. Under the Hospital Readmissions Reduction Program, a hospital can lose up to 3% of its entire Medicare reimbursement. For a mid-size hospital, that translates to $1 to 3 million a year in avoidable losses. Not from bad medicine, but from not reaching the right patients in time."

---

### Slide 4 — Why Current Approaches Fall Short (40 sec)

> "So why hasn't this been solved? It's not that the causes are unknown. The problem is that the tools hospitals have today were not built for this.
>
> Most still rely on the LACE score, a rule-based system designed in the 1990s. It gives every patient a number, but it cannot adapt when a patient's situation is complex, and it cannot process thousands of discharges a day fast enough to matter.
>
> There is a 48 to 72-hour window after discharge when a phone call or a medication review can still change the outcome. With LACE, by the time a care coordinator knows who to call, that window is already gone."

---

## QUESTION 2 — Why is the model useful or valuable?

### Slide 5 — What the Model Does (55 sec)

> "That window is exactly what our system is built for.
>
> The moment a discharge is recorded, the model pulls data from the patient record and returns a risk score. Not a broad tier, but a precise probability. This patient: 74% chance of readmission within 30 days. In under a second.
>
> It was trained on 100,000 historical patient encounters using XGBoost. What that means in practice is that it picks up on patterns no rule would catch. When a third inpatient visit is combined with a recent insulin change and a patient living alone, that combination makes readmission almost inevitable. No one wrote that rule. The model learned it.
>
> And crucially, it is not a black box. Every prediction comes with a breakdown of which factors drove the score. So a clinician is not just told to act. They are shown exactly why."

---

### Slides 6 & 7 — Business Value & ROI (40 sec)

> "Let's put numbers to it. Take a 500-bed hospital with a 15% readmission rate and roughly $6 million in annual exposure from losses and penalties.
>
> A 15 to 20% reduction in readmissions among flagged patients brings 900K to 1.2 million dollars in direct savings, and up to 1.5 million in penalty avoidance. Break-even in under 12 months. That is the financial case.
>
> The operational case is just as strong. Care coordinators stop applying the same protocol to every patient and focus on the 20% who actually need them. That shift alone drives a 30 to 40% improvement in team efficiency."

---

## QUESTION 3 — How could it be integrated in a real company workflow?

### Slide 8 — Integration Workflow (30 sec)

> "And it does not require ripping out existing infrastructure to deploy.
>
> A discharge event triggers the model. The score comes back in seconds. High-risk patients surface automatically on the care coordinator's worklist, with their key risk factors already visible before the patient leaves the building. The follow-up protocol is initiated within seven days. As real outcomes accumulate, the model retrains on them. The system improves without anyone having to manage it manually.
>
> Our current build is a proof of concept. The target architecture connects to existing EHR systems via API, with minimal disruption to clinical workflows."

---

## Close & Handoff (20 sec)

> "That is the business case. A real problem with a measurable cost, and a system that fits into how hospitals already operate.
>
> But saying it works is one thing. My teammates will now show you how it was actually built, from raw data all the way to a live deployment."

---

*Total estimated time: ~4 min 30 sec*
*Rubric: What problem does it solve? | Why is the model useful or valuable? | How could it be integrated?*
