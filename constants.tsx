import { Lesson, Subject, FileNode } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'html', title: 'HTML5', icon: 'FileCode', description: 'The structural foundation of every web application.', color: '#e34c26' },
  { id: 'css', title: 'CSS3', icon: 'Palette', description: 'Advanced UI design and layout architecture.', color: '#264de4' },
  { id: 'js', title: 'JavaScript', icon: 'Zap', description: 'High-performance dynamic logic and system scripting.', color: '#f7df1e' },
  { id: 'py', title: 'Python', icon: 'Terminal', description: 'Backend logic, data science, and automation.', color: '#3776ab' },
];

const generateLessons = (): Lesson[] => {
  const lessons: Lesson[] = [];

  // --- HTML LEVEL 1: FOUNDATIONS ---
  const htmlL1: Partial<Lesson>[] = [
    {
      id: 'html-l1-q1',
      subjectId: 'html',
      level: 1,
      title: 'L1: Textual Content',
      description: '### Qs1. Paragraph Implementation\nIn HTML, text content is primarily wrapped in paragraph tags to ensure proper spacing and screen-reader accessibility. Use the correct tag to add a paragraph with the text **"Hello World!"**.',
      initialCode: '<!-- Implement paragraph here -->',
      validationRegex: '<p>\\s*Hello\\s+World!\\s*</p>',
      solution: '<p>Hello World!</p>',
      successMessage: 'Correct. The <p> tag defines a paragraph of text.'
    },
    {
      id: 'html-l1-q2',
      subjectId: 'html',
      level: 1,
      title: 'L1: Heading Hierarchy',
      description: '### Qs2. Logical Document Structure\nSearch engines and accessibility tools rely on headings to understand document importance. Mark up the following text using a strict hierarchy:\n- **"Delta"** is the primary (most important) heading.\n- **"Full Stack Web Development"** is a secondary heading.\n- **"MERN Stack"** is a tertiary heading.\n- **"Let\'s begin our learning journey!"** is standard body text.',
      initialCode: 'Delta\nFull Stack Web Development\nMERN Stack\nLet\'s begin our learning journey!',
      validationRegex: '<h1>\\s*Delta\\s*</h1>[\\s\\S]*<h2>\\s*Full\\s+Stack\\s+Web\\s+Development\\s*</h2>[\\s\\S]*<h3>\\s*MERN\\s+Stack\\s*</h3>[\\s\\S]*<p>\\s*Let\'s\\s+begin\\s+our\\s+learning\\s+journey!\\s*</p>',
      solution: '<h1>Delta</h1>\n<h2>Full Stack Web Development</h2>\n<h3>MERN Stack</h3>\n<p>Let\'s begin our learning journey!</p>',
      successMessage: 'Excellent. Proper heading hierarchy is the key to SEO.'
    },
    {
      id: 'html-l1-q4',
      subjectId: 'html',
      level: 1,
      title: 'L1: Data Sequencing',
      description: '### Qs4. Ordered Lists\nWhen data order matters (like a ranking or steps), we use an **Ordered List**. Create a list containing these students in order:\n1. Deepak\n2. Epsita\n3. Lakshita\n4. Tanmay\n5. Agrim',
      initialCode: '<!-- Create an ordered list (<ol>) -->',
      validationRegex: '<ol>[\\s\\S]*<li>\\s*Deepak\\s*</li>[\\s\\S]*<li>\\s*Epsita\\s*</li>[\\s\\S]*<li>\\s*Lakshita\\s*</li>[\\s\\S]*<li>\\s*Tanmay\\s*</li>[\\s\\S]*<li>\\s*Agrim\\s*</li>[\\s\\S]*</ol>',
      solution: '<ol>\n  <li>Deepak</li>\n  <li>Epsita</li>\n  <li>Lakshita</li>\n  <li>Tanmay</li>\n  <li>Agrim</li>\n</ol>',
      successMessage: 'Great. The <ol> tag automatically handles the numbering for you.'
    },
    {
      id: 'html-l1-q5',
      subjectId: 'html',
      level: 1,
      title: 'L1: Thematic Breaks & Entities',
      description: '### Qs5. HR Tag & Character References\nThe `<hr>` tag represents a thematic break (horizontal line). Below this line, display the **Character Reference** for an ampersand (&) within a paragraph tag.',
      initialCode: '<!-- Use <hr> and then the ampersand entity -->',
      validationRegex: '<hr\\s*/?>[\\s\\S]*&amp;',
      solution: '<hr>\n<p>&amp;</p>',
      successMessage: 'Well done! Character entities allow you to display characters that would otherwise be parsed as code.'
    }
  ];

  // --- HTML LEVEL 2: SEMANTIC RICHNESS ---
  const htmlL2: Partial<Lesson>[] = [
    {
      id: 'html-l2-q1',
      subjectId: 'html',
      level: 2,
      title: 'L2: Multimedia Integration',
      description: '### Qs1. Video Streaming\nHTML5 introduced native multimedia support. Implement a `video` element and ensure the `controls` attribute is present so users can play/pause.',
      initialCode: '<!-- Implement video with controls -->',
      validationRegex: '<video[\\s\\S]*controls',
      solution: '<video width="320" height="240" controls>\n  <source src="movie.mp4" type="video/mp4">\n</video>',
      successMessage: 'Multimedia mastered. Use the "controls" attribute to empower the user.'
    },
    {
      id: 'html-l2-q2',
      subjectId: 'html',
      level: 2,
      title: 'L2: Semantic Architecture',
      description: '### Qs2. Self-Check: Is <video> Semantic?\n**Semantic Tags** tell both the browser and the developer exactly what content is inside. Is the `<video>` tag considered a semantic tag?\nAnswer with a `<p>` containing **"Yes"** or **"No"**.',
      initialCode: '<p>Answer: </p>',
      validationRegex: '<p>\\s*Answer:\\s*(Yes|yes)\\s*</p>',
      solution: '<p>Answer: Yes</p>',
      successMessage: 'Correct. It describes exactly what it holds: video content.'
    },
    {
      id: 'html-l2-q3',
      subjectId: 'html',
      level: 2,
      title: 'L2: Mathematical Superscripts',
      description: '### Qs3. Text Formatting\nRender the following text with proper superscripts:\n**Today is the 9th of October and 2^4 = 16 always**\n*(Hint: Use the `<sup>` tag for "th" and "4")*',
      initialCode: '<p>Today is the 9 of October and 2 = 16 always</p>',
      validationRegex: '9<sup>\\s*th\\s*</sup>[\\s\\S]*2<sup>\\s*4\\s*</sup>',
      solution: '<p>Today is the 9<sup>th</sup> of October and 2<sup>4</sup> = 16 always</p>',
      successMessage: 'Perfect. Superscripts are vital for dates and math.'
    },
    {
      id: 'html-l2-q4',
      subjectId: 'html',
      level: 2,
      title: 'L2: Semantic Sections',
      description: '### Qs4. Achievement Log\nEncapsulate your achievements in a `<section>`. List them using an unordered list (`<ul>`), bold the titles (`<b>`), and separate it from other content with a thematic break (`<hr>`).',
      initialCode: '<!-- Create achievement section -->',
      validationRegex: '<section>[\\s\\S]*<ul>[\\s\\S]*<b>[\\s\\S]*<hr\\s*/?>',
      solution: '<section>\n  <h2>Achievements</h2>\n  <ul>\n    <li><b>Hackathon Winner</b> 2024</li>\n  </ul>\n  <hr>\n</section>',
      successMessage: 'Semantic layout achieved. <section> is a key block element.'
    },
    {
      id: 'html-l2-q5',
      subjectId: 'html',
      level: 2,
      title: 'L2: Legal Entities',
      description: '### Qs5. Copyright & Trademark\nLegal symbols require specific entities. Print the symbols for **copyright** and **trademark** on your page.',
      initialCode: '<!-- Print entities here -->',
      validationRegex: '&copy;[\\s\\S]*&trade;',
      solution: '<p>Copyright &copy; 2025. All rights reserved &trade;.</p>',
      successMessage: 'Great. &copy; and &trade; are industry standards.'
    }
  ];

  // --- HTML LEVEL 3: ADVANCED DATA & INTERACTION ---
  const htmlL3: Partial<Lesson>[] = [
    {
      id: 'html-l3-q1',
      subjectId: 'html',
      level: 3,
      title: 'L3: Complex Table',
      description: '### Qs1. Recreate the Complex Student Table\nComplex tables use `colspan` and `rowspan` to merge cells. Recreate the table exactly as shown below with visible borders.\n\n**Visual Target Reference:**\n<div style="background:#1c2128; border:1px solid #30363d; border-radius:12px; padding:25px; margin:20px 0; overflow-x:auto;">\n<table border="1" style="width:100%; border-collapse:collapse; color:#e6edf3; border: 3px solid #58a6ff; font-family:sans-serif; text-align:center;">\n  <tr><th colspan="4" style="border: 3px solid #58a6ff; background:#21262d; padding:15px; font-size:18px; font-weight:900;">Student Information</th></tr>\n  <tr>\n    <th rowspan="6" style="border: 3px solid #58a6ff; background:#21262d; padding:15px; width:60px; writing-mode: vertical-lr; transform: rotate(180deg);">Info</th>\n    <th rowspan="2" style="border: 3px solid #58a6ff; background:#21262d; padding:10px;">Name</th>\n    <th colspan="2" style="border: 3px solid #58a6ff; background:#21262d; padding:10px;">Address</th>\n  </tr>\n  <tr>\n    <th style="border: 3px solid #58a6ff; background:#21262d; padding:10px;">City</th>\n    <th style="border: 3px solid #58a6ff; background:#21262d; padding:10px;">House</th>\n  </tr>\n  <tr>\n    <td style="border: 3px solid #58a6ff; padding:10px; font-weight:600;">A</td>\n    <td style="border: 3px solid #58a6ff; padding:10px;">Delhi</td>\n    <td style="border: 3px solid #58a6ff; padding:10px;">1</td>\n  </tr>\n  <tr>\n    <td style="border: 3px solid #58a6ff; padding:10px; font-weight:600;">B</td>\n    <td style="border: 3px solid #58a6ff; padding:10px;">Mumbai</td>\n    <td style="border: 3px solid #58a6ff; padding:10px;">2</td>\n  </tr>\n  <tr>\n    <td style="border: 3px solid #58a6ff; padding:10px; font-weight:600;">C</td>\n    <td style="border: 2px solid #58a6ff; padding:10px;">Kolkata</td>\n    <td style="border: 2px solid #58a6ff; padding:10px;">3</td>\n  </tr>\n  <tr>\n    <td style="border: 3px solid #58a6ff; padding:10px; font-weight:600;">D</td>\n    <td style="border: 2px solid #58a6ff; padding:10px;">Pune</td>\n    <td style="border: 2px solid #58a6ff; padding:10px;">4</td>\n  </tr>\n</table>\n</div>',
      initialCode: '<table border="1">\n  <!-- Build your table hierarchy using tr, th, td, rowspan, and colspan -->\n</table>',
      validationRegex: '<table[\\s\\S]*colspan="4"[\\s\\S]*rowspan="6"',
      solution: '<table border="1">\n  <tr><th colspan="4">Student Information</th></tr>\n  <tr><th rowspan="6">Info</th><th rowspan="2">Name</th><th colspan="2">Address</th></tr>\n  <tr><th>City</th><th>House</th></tr>\n  <tr><td>A</td><td>Delhi</td><td>1</td></tr>\n  <tr><td>B</td><td>Mumbai</td><td>2</td></tr>\n  <tr><td>C</td><td>Kolkata</td><td>3</td></tr>\n  <tr><td>D</td><td>Pune</td><td>4</td></tr>\n</table>',
      successMessage: 'Incredible! You have mastered cell merging in HTML tables. This is a vital skill for presenting complex data.'
    },
    {
      id: 'html-l3-q2',
      subjectId: 'html',
      level: 3,
      title: 'L3: Input Architectures',
      description: '### Qs2. Comprehensive Form\nBuild an interactive form including:\n- Name Input\n- Radio Buttons for Sex (Male/Female)\n- Country Select (India, Nepal, USA, Canada)\n- Message Textarea\n- Subscription Checkbox\n- Submit Button',
      initialCode: '<form>\n  <!-- Build form here -->\n</form>',
      validationRegex: 'type="text"[\\s\\S]*type="radio"[\\s\\S]*<select[\\s\\S]*<textarea[\\s\\S]*type="checkbox"',
      solution: '<form>\n  <label>Name: <input type="text"></label><br>\n  <label>Sex: </label>\n  <input type="radio" name="sex"> Male\n  <input type="radio" name="sex"> Female<br>\n  <label>Country: </label>\n  <select>\n    <option>India</option>\n    <option>Nepal</option>\n    <option>USA</option>\n    <option>Canada</option>\n  </select><br>\n  <label>Message: </label><br>\n  <textarea></textarea><br>\n  <label><input type="checkbox"> Subscribe?</label><br>\n  <button type="submit">Submit</button>\n</form>',
      successMessage: 'Form complete. Use <label> for better UX and accessibility.'
    },
    {
      id: 'html-l3-q3',
      subjectId: 'html',
      level: 3,
      title: 'L3: Feedback Systems',
      description: '### Qs3. Feedback Form Implementation\nRecreate the Feedback Form with:\n- "Feedback Form" Heading\n- Email input with placeholder\n- Rating system (5 Radio Buttons: 1 to 5)\n- Submit button with text: **"Send your message!"**',
      initialCode: '<!-- Implement Feedback Form -->',
      validationRegex: 'Feedback Form[\\s\\S]*type="email"[\\s\\S]*Rate us our of 5[\\s\\S]*Send your message!',
      solution: '<form>\n  <h2>Feedback Form</h2>\n  <input type="email" placeholder="Write your email"><br>\n  <textarea placeholder="Message"></textarea><br>\n  <p>Rate us our of 5:</p>\n  <input type="radio"> 1\n  <input type="radio"> 2\n  <input type="radio"> 3\n  <input type="radio"> 4\n  <input type="radio"> 5<br>\n  <button>Send your message!</button>\n</form>',
      successMessage: 'Perfect. You are now a master of HTML data collection.'
    }
  ];

  [...htmlL1, ...htmlL2, ...htmlL3].forEach(l => {
    lessons.push({ completed: false, subjectId: 'html', level: l.level || 1, ...l } as Lesson);
  });

  // --- OTHER SUBJECTS ---
  lessons.push({ 
    id: 'css-1', subjectId: 'css', level: 1, completed: false,
    title: 'Visual Box Model', 
    description: '### Layout Basics\nApply `royalblue` background and `20px` padding to the `div`.', 
    initialCode: 'div {\n  /* Style here */\n}', 
    validationRegex: 'padding:\\s*20px',
    solution: 'div { background-color: royalblue; padding: 20px; }'
  });

  lessons.push({ 
    id: 'js-1', subjectId: 'js', level: 1, completed: false,
    title: 'Dynamic Variables', 
    description: '### State Declaration\nDeclare a `const` named `developer` with the value "Atiq".', 
    initialCode: '', 
    validationRegex: 'const\\s+developer\\s*=\\s*[\'"]Atiq[\'"]', 
    solution: 'const developer = "Atiq";'
  });

  return lessons;
};

export const INITIAL_LESSONS: Lesson[] = generateLessons();

export const INITIAL_WORKSPACE: FileNode[] = [
  { id: 'root', name: 'project', type: 'folder', parentId: null, isOpen: true },
  { id: 'index-html', name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>DevForge Lab</h1>\n  <p>Your engineering sandbox is active.</p>\n  <script src="script.js"></script>\n</body>\n</html>', parentId: 'root' },
  { id: 'style-css', name: 'style.css', type: 'file', content: 'body { background: #0d1117; color: white; display: flex; flex-direction: column; align-items: center; padding-top: 100px; font-family: sans-serif; }', parentId: 'root' },
  { id: 'script-js', name: 'script.js', type: 'file', content: 'console.log("Hello from script.js!");', parentId: 'root' },
  { id: 'package-json', name: 'package.json', type: 'file', content: '{\n  "name": "devforge-project",\n  "version": "1.0.0",\n  "dependencies": {}\n}', parentId: 'root' },
];

export const ADMIN_CREDENTIALS = {
  email: 's.atiqurrahman2003@gmail.com',
  password: 'atiK@5335'
};