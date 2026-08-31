<!--

Heavily inspired by https://www.resume.lol/templates/jakes-template
Just some formatting changes I prefer to fit more stuff

---------------------------------------------------------------------------------------

Easily remove personal info by using a variable follow with a second value and "||":

@NAME=Real Name||Hidden Name

and change @REDACTED to be true

-->

@REDACTED=false
@NAME=Jane Doe||Name
@EMAIL=jane.doe@email.com||fake@email.com
@PHONE=555-123-4567||123-456-fake
@PORTFOLIO=janedoe.dev||portfolio.com
@LINKEDIN=jane-doe||linkedin.com/in/fake
@GITHUB=janedoe||fake

# {NAME}

<div class="section headerInfo">

- {PHONE}
- [{PORTFOLIO}]({PORTFOLIO})
- [{EMAIL}](mailto:{EMAIL})
- [linkedin.com/in/{LINKEDIN}](https://linkedin.com/in/{LINKEDIN})
- [github.com/{GITHUB}](https://github.com/{GITHUB})
</div>

## Education

### State University <span class="spacer"></span><span class="normal">Graduation: May 2027</span>

#### B.S. Computer Science, GPA: 3.8<span class="spacer"></span>Anytown, ST

<!-- Uncomment these if applicable -->
<!-- - **Relevant Coursework**: Data Structures & Algorithms, Y, Z -->
<!-- - **Organizations**: Organization X -->

## Experience

### Software Engineer Intern <span class="spacer"></span><span class="normal"> May 2026 &ndash; Present </span>

#### Example Corp <span class="spacer"></span> Remote

<!-- keep all bullet points within one line -->
<!-- aim for ~15 words -->
- Built a feature that improved processing throughput by 20% for a high-traffic internal service.
- Collaborated with a team of 5 engineers to ship a new public API used by 3 downstream teams.
- Wrote integration tests that reduced regression bugs reaching production by half.

### Teaching Assistant <span class="spacer"></span><span class="normal"> Aug. 2025 &ndash; May 2026 </span>

#### State University <span class="spacer"></span> Anytown, ST

- Held weekly office hours for 40+ students in an introductory data structures course.
- Graded assignments and exams, providing detailed feedback on algorithmic complexity.

## Projects

### [Resume Builder](https://github.com/janedoe/resume-builder) <span class="spacer"></span><span class="normal">React, TypeScript, Vite</span>

- Built a live-updating resume editor with a markdown source panel and styled preview.
- Added one-click PDF export using html2canvas and jsPDF.

### [Task Tracker](https://github.com/janedoe/task-tracker) <span class="spacer"></span><span class="normal">Python, FastAPI, PostgreSQL</span>

- Designed a REST API for a small team task tracker with role-based access control.
- Deployed via CI/CD pipeline with automated tests on every pull request.

## Technical Skills

**Languages**: Java, Python, TypeScript, JavaScript, SQL

**Frameworks**: React, Node.js

**Technologies**: PostgreSQL, Docker, Git, GitHub Actions
