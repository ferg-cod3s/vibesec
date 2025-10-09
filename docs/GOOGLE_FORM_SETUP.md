# Google Form Setup Guide for VibeSec User Testing

**Purpose**: Step-by-step instructions to create the VibeSec User Feedback Form in Google Forms.

**Estimated Time**: 20-30 minutes

---

## Setup Instructions

### Step 1: Create New Form

1. Go to https://forms.google.com
2. Click **"+ Blank form"**
3. Click "Untitled form" at top and rename to: **VibeSec User Feedback Form**
4. Add description:

```
Thank you for testing VibeSec! 🙏

Your feedback will help us improve the tool's clarity, usability, and effectiveness. Please answer the following questions based on your testing experience.

⏱️ Estimated time: 10-15 minutes
🎁 First 50 respondents receive early access to VibeSec Pro features!
```

---

## Section 1: Installation & Setup

### Q1. How easy was the installation process?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Very Difficult
- **Label for 10**: Very Easy
- **Required**: Yes

### Q2. Did you encounter any issues during installation?

- **Type**: Multiple choice
- **Options**:
  - Yes
  - No
- **Required**: Yes

### Q2a. If yes, please describe the issues

- **Type**: Paragraph
- **Show based on**: Q2 = "Yes"
- **Required**: No

### Q3. Was the documentation sufficient for getting started?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Not Sufficient
- **Label for 10**: Completely Sufficient
- **Required**: Yes

### Q3a. What could be improved in the documentation?

- **Type**: Paragraph
- **Required**: No

---

## Section 2: Scan Results Comprehension

**Add Section**: Click "+ Add section" icon

### Q4. How clear were the vulnerability descriptions?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Very Confusing
- **Label for 10**: Very Clear
- **Required**: Yes

### Q4a. Example of a CLEAR finding (optional)

- **Type**: Paragraph
- **Help text**: "Copy/paste an example you found helpful"
- **Required**: No

### Q4b. Example of a CONFUSING finding (optional)

- **Type**: Paragraph
- **Help text**: "Copy/paste an example that was unclear"
- **Required**: No

### Q5. Were the remediation suggestions actionable?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Not Actionable
- **Label for 10**: Very Actionable
- **Required**: Yes

### Q5a. Comments on remediation suggestions

- **Type**: Paragraph
- **Help text**: "Could you implement the suggested fixes? Were the examples helpful? What would make them more actionable?"
- **Required**: No

### Q6. How helpful were the code snippets in the findings?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Not Helpful
- **Label for 10**: Very Helpful
- **Required**: Yes

### Q6a. Suggestions for code snippets

- **Type**: Paragraph
- **Help text**: "Should we show more/less context? Different format?"
- **Required**: No

### Q7. Do the severity levels (CRITICAL, HIGH, MEDIUM, LOW) make sense?

- **Type**: Multiple choice
- **Options**:
  - Yes, all severities seem appropriate
  - Some findings seem mis-categorized
  - Not sure / Need more guidance
- **Required**: Yes

### Q7a. If mis-categorized, which findings?

- **Type**: Paragraph
- **Show based on**: Q7 = "Some findings seem mis-categorized"
- **Help text**: "Specify finding + suggested severity"
- **Required**: No

---

## Section 3: Usability

**Add Section**: Click "+ Add section" icon

### Q8. How intuitive was the command-line interface?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Very Confusing
- **Label for 10**: Very Intuitive
- **Required**: Yes

### Q8a. Suggestions for CLI improvement

- **Type**: Paragraph
- **Help text**: "Commands, flags, output format, etc."
- **Required**: No

### Q9. How long did the scan take to complete?

- **Type**: Multiple choice
- **Options**:
  - <1 second (Excellent)
  - 1-5 seconds (Good)
  - 5-15 seconds (Acceptable)
  - >15 seconds (Too slow)
- **Required**: Yes

### Q9a. How many files were scanned?

- **Type**: Short answer
- **Validation**: Number, Greater than 0
- **Required**: No

### Q9b. Was performance acceptable for your use case?

- **Type**: Paragraph
- **Required**: No

### Q10. Which output format did you prefer?

- **Type**: Multiple choice
- **Options**:
  - Plain text (terminal output)
  - JSON (machine-readable)
  - Both equally useful
  - Neither / need other format
- **Required**: Yes

### Q10a. Why did you prefer this format?

- **Type**: Paragraph
- **Required**: No

---

## Section 4: Accuracy & False Positives

**Add Section**: Click "+ Add section" icon

### Q11. Did VibeSec detect all the intentional vulnerabilities in the sample API?

- **Type**: Multiple choice
- **Options**:
  - Yes, found all 5 vulnerabilities
  - Missed some vulnerabilities
  - Found vulnerabilities but incorrect categorization
  - Didn't test the sample vulnerable code
- **Required**: Yes

### Q11a. If vulnerabilities were missed, which ones?

- **Type**: Paragraph
- **Show based on**: Q11 = "Missed some vulnerabilities"
- **Help text**: "Specify vulnerability type and location"
- **Required**: No

### Q12. Did you encounter any false positives?

- **Type**: Multiple choice
- **Options**:
  - Yes
  - No
  - Not sure
- **Required**: Yes

### Q12a. Describe false positives

- **Type**: Paragraph
- **Show based on**: Q12 = "Yes"
- **Help text**: "File, line number, what VibeSec reported, and why it's a false positive"
- **Required**: No

### Q13. Did you test VibeSec on your own code?

- **Type**: Multiple choice
- **Options**:
  - Yes
  - No
- **Required**: Yes

### Q13a. Total findings on your code

- **Type**: Short answer
- **Show based on**: Q13 = "Yes"
- **Validation**: Number
- **Required**: No

### Q13b. Estimated true positives

- **Type**: Short answer
- **Show based on**: Q13 = "Yes"
- **Validation**: Number
- **Required**: No

### Q13c. Estimated false positives

- **Type**: Short answer
- **Show based on**: Q13 = "Yes"
- **Validation**: Number
- **Required**: No

### Q13d. Overall accuracy rating on your code

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Show based on**: Q13 = "Yes"
- **Label for 1**: Very Inaccurate
- **Label for 10**: Very Accurate
- **Required**: No

### Q13e. Describe your experience testing on your own code

- **Type**: Paragraph
- **Show based on**: Q13 = "Yes"
- **Help text**: "What worked well? What didn't?"
- **Required**: No

---

## Section 5: Target Audience Fit

**Add Section**: Click "+ Add section" icon

### Q14. What is your experience level with security?

- **Type**: Multiple choice
- **Options**:
  - No prior security knowledge
  - Basic understanding
  - Intermediate (some security training)
  - Advanced (professional security experience)
- **Required**: Yes

### Q15. Did VibeSec help you understand the security issues?

- **Type**: Linear scale
- **Scale**: 1 to 10
- **Label for 1**: Not at All
- **Label for 10**: Completely
- **Required**: Yes

### Q15a. Specific examples of what helped

- **Type**: Paragraph
- **Help text**: "Explanations, examples, links, etc."
- **Required**: No

### Q15b. What could help more?

- **Type**: Paragraph
- **Help text**: "Additional resources, visual diagrams, video tutorials?"
- **Required**: No

### Q16. Would you use VibeSec in your development workflow?

- **Type**: Multiple choice
- **Options**:
  - Definitely yes
  - Probably yes
  - Maybe / Need improvements
  - Probably not
  - Definitely not
- **Required**: Yes

### Q16a. Why or why not?

- **Type**: Paragraph
- **Required**: Yes

---

## Section 6: Comparison & Context

**Add Section**: Click "+ Add section" icon

### Q17. Have you used other security scanning tools?

- **Type**: Multiple choice
- **Options**:
  - Yes
  - No
- **Required**: Yes

### Q17a. If yes, which tools?

- **Type**: Paragraph
- **Show based on**: Q17 = "Yes"
- **Help text**: "ESLint security plugins, SonarQube, Snyk, GitHub Advanced Security, etc."
- **Required**: No

### Q18. How does VibeSec compare to other tools?

**Note**: Create 4 sub-questions in a "Multiple choice grid"

- **Type**: Multiple choice grid
- **Rows**:
  - Clarity
  - Ease of use
  - Accuracy
  - Speed
- **Columns**:
  - Much Better
  - Slightly Better
  - Same
  - Slightly Worse
  - Much Worse
  - N/A (Haven't used others)
- **Required**: Yes (if Q17 = "Yes")

### Q18a. Comparison comments

- **Type**: Paragraph
- **Help text**: "What makes VibeSec different (better or worse)?"
- **Required**: No

---

## Section 7: Feature Requests

**Add Section**: Click "+ Add section" icon

### Q19. Rank these potential features (1 = Most Important, 5 = Least Important)

**Note**: Create 5 sub-questions

#### Q19a. IDE integrations (VS Code, IntelliJ)

- **Type**: Linear scale
- **Scale**: 1 to 5
- **Label for 1**: Most Important
- **Label for 5**: Least Important
- **Required**: Yes

#### Q19b. CI/CD integrations (GitHub Actions, GitLab CI)

- **Type**: Linear scale
- **Scale**: 1 to 5
- **Label for 1**: Most Important
- **Label for 5**: Least Important
- **Required**: Yes

#### Q19c. More programming languages (Java, Go, Ruby, etc.)

- **Type**: Linear scale
- **Scale**: 1 to 5
- **Label for 1**: Most Important
- **Label for 5**: Least Important
- **Required**: Yes

#### Q19d. Custom rule creation (define your own security rules)

- **Type**: Linear scale
- **Scale**: 1 to 5
- **Label for 1**: Most Important
- **Label for 5**: Least Important
- **Required**: Yes

#### Q19e. Fix suggestions with code diffs (show before/after)

- **Type**: Linear scale
- **Scale**: 1 to 5
- **Label for 1**: Most Important
- **Label for 5**: Least Important
- **Required**: Yes

### Q20. What would make VibeSec more useful for you?

- **Type**: Paragraph
- **Help text**: "Features, integrations, documentation, training materials, etc."
- **Required**: No

### Q21. Would you recommend VibeSec to colleagues? (Net Promoter Score)

- **Type**: Linear scale
- **Scale**: 0 to 10
- **Label for 0**: Definitely Not
- **Label for 10**: Definitely Yes
- **Required**: Yes

### Q21a. Why would you (or wouldn't you) recommend VibeSec?

- **Type**: Paragraph
- **Required**: No

---

## Section 8: Open Feedback

**Add Section**: Click "+ Add section" icon

### Q22. What did you like MOST about VibeSec?

- **Type**: Paragraph
- **Help text**: "Be specific! This helps us know what to preserve/enhance"
- **Required**: No

### Q23. What frustrated you the MOST?

- **Type**: Paragraph
- **Help text**: "Be honest! This helps us prioritize improvements"
- **Required**: No

### Q24. Any other comments, suggestions, or observations?

- **Type**: Paragraph
- **Help text**: "Anything we didn't ask about"
- **Required**: No

---

## Section 9: Technical Details

**Add Section**: Click "+ Add section"
**Section description**: "Optional: This helps us understand environmental factors"

### Q25. Operating System

- **Type**: Multiple choice
- **Options**:
  - Windows
  - macOS
  - Linux (Ubuntu)
  - Linux (Debian)
  - Linux (Fedora)
  - Linux (Arch)
  - Linux (Other)
  - Other
- **Required**: No

### Q26. Node.js Version

- **Type**: Short answer
- **Help text**: "Run 'node --version' in terminal"
- **Required**: No

### Q27. Project Size Tested

- **Type**: Short answer
- **Help text**: "Approximate number of files"
- **Required**: No

### Q28. Primary Language

- **Type**: Multiple choice
- **Options**:
  - JavaScript
  - Python
  - Both
  - Other
- **Required**: No

---

## Section 10: Follow-Up

**Add Section**: Click "+ Add section"

### Q29. Can we follow up with you for clarification?

- **Type**: Multiple choice
- **Options**:
  - Yes, you can contact me
  - No, please keep my feedback anonymous
- **Required**: Yes

### Q29a. Email address (optional)

- **Type**: Short answer
- **Show based on**: Q29 = "Yes, you can contact me"
- **Validation**: Email
- **Required**: No

---

## Final Settings

### Step 2: Configure Form Settings

1. Click ⚙️ **Settings** (gear icon top-right)

#### General Tab:
- ✅ Collect email addresses: **OFF** (unless you want to track respondents)
- ✅ Limit to 1 response: **OFF** (allow multiple devices)
- ✅ Respondents can edit after submit: **ON**

#### Presentation Tab:
- ✅ Show progress bar: **ON**
- ✅ Shuffle question order: **OFF**
- ✅ Show link to submit another response: **OFF**
- **Confirmation message**:
  ```
  🎉 Thank you for your feedback!

  Your insights will help make VibeSec better for developers worldwide.

  As a thank you, we'll send early access codes to the first 50 respondents within 2 weeks.

  Questions? Email: feedback@vibesec.dev
  ```

#### Quizzes Tab:
- ✅ Make this a quiz: **OFF**

### Step 3: Create Short URL

1. Click **Send** button (top-right)
2. Click the **link icon** (🔗)
3. Check **"Shorten URL"**
4. Copy the `https://forms.gle/XXXXXX` link
5. Save this URL to `docs/PHASE4_FORM_URL.txt`

### Step 4: Set Up Response Notifications

1. Click **Responses** tab at top
2. Click **⋮** (three dots) menu
3. Select **"Get email notifications for new responses"**
4. Enable notifications

### Step 5: Test Submission

1. Open the short URL in an **incognito window**
2. Complete the entire form as a test user
3. Verify all branching logic works (Q2a, Q7a, Q11a, etc.)
4. Check that responses appear in the **Responses** tab
5. Delete test response: Responses → Select row → Delete

---

## Export & Tracking

### View Responses

**In Google Forms**:
- Click **Responses** tab
- View **Summary** (charts) or **Individual** (per response)

**Export to Sheets**:
1. Responses → Click green Sheets icon
2. Creates linked Google Sheets spreadsheet
3. Auto-updates as new responses arrive

### Recommended Tracking

Create a simple tracker:

**File**: `docs/PHASE4_RESPONSE_TRACKER.md`

```markdown
# Phase 4 Response Tracker

| Date | Total Responses | Notes |
|------|-----------------|-------|
| 2025-10-10 | 0 | Form published |
| 2025-10-12 | 5 | Pilot testing complete |
| 2025-10-17 | 8 | Main wave started |
| ...  | ... | ... |

**Target**: 15-20 responses by 2025-11-07
**Current**: ____ responses
**Progress**: ____% to target
```

---

## Checklist

Before sending form to testers:

- [ ] All 29 questions added to form
- [ ] Branching logic configured (7 conditional questions)
- [ ] Settings configured (progress bar, confirmation message)
- [ ] Short URL created and saved
- [ ] Email notifications enabled
- [ ] Test submission completed in incognito mode
- [ ] Test response deleted
- [ ] Linked Google Sheets created for analysis
- [ ] Form URL saved to `PHASE4_FORM_URL.txt`

---

## Next Steps

After form is ready:

1. Update recruitment email template with actual form URL
2. Begin pilot testing (3-5 trusted testers)
3. Monitor first responses closely
4. Create FAQ document from pilot feedback
5. Launch main testing wave

---

**Document Owner**: VibeSec Core Team  
**Created**: 2025-10-10  
**Estimated Setup Time**: 20-30 minutes  
**Form Version**: 1.0
