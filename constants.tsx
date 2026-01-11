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
      validationRegex: '<section>[\s\S]*<ul>[\s\S]*<b>[\s\S]*<hr\s*/?>',
      solution: '<section>\n  <h2>Achievements</h2>\n  <ul>\n    <li><b>Hackathon Winner</b> 2024</li>\n  </ul>\n  <hr>\n</section>',
      successMessage: 'Semantic layout achieved. <section> is a key block element.'
    },
    {
      id: 'html-l2-q5',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Images',
      description: '### Qs5. Image Integration\nUse the `<img>` tag to display an image from the web. Use the following URL for practice: https://www.w3schools.com/tags/img_girl.jpg\n\nMake sure to include the `alt` attribute for accessibility. You can use "Sample Girl Image" as the alt text.\n\n**Practice Link**: [W3Schools Image Tag](https://www.w3schools.com/tags/tag_img.asp)',
      initialCode: '<!-- Add image here -->',
      validationRegex: '<img\s+[^>]*src\s*=\s*["\'][^"\']*/tags/img_girl\.jpg["\'][^>]*>',
      solution: '<img src="https://www.w3schools.com/tags/img_girl.jpg" alt="Sample Girl Image">',
      successMessage: 'Great! You have successfully added an image to your HTML page.'
    },
    {
      id: 'html-l2-q6',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Video',
      description: '### Qs6. Video Integration\nUse the `<video>` tag to embed a video from the web. Use the following URL for practice: https://www.w3schools.com/html/mov_bbb.mp4\n\nMake sure to include the `controls` attribute so users can play/pause the video.\n\n**Practice Link**: [W3Schools Video Tag](https://www.w3schools.com/tags/tag_video.asp)',
      initialCode: '<!-- Add video here -->',
      validationRegex: '<video\s+[^>]*controls[^>]*>\s*<source\s+[^>]*src\s*=\s*["\'][^"\']*/html/mov_bbb\.mp4["\'][^>]*>',
      solution: '<video width="320" height="240" controls>\n  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">\n</video>',
      successMessage: 'Excellent! You have successfully added a video to your HTML page.'
    },
    {
      id: 'html-l2-q7',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Audio',
      description: '### Qs7. Audio Integration\nUse the `<audio>` tag to embed an audio file from the web. Use the following URL for practice: https://www.w3schools.com/html/horse.ogg\n\nMake sure to include the `controls` attribute so users can play/pause the audio.\n\n**Practice Link**: [W3Schools Audio Tag](https://www.w3schools.com/tags/tag_audio.asp)',
      initialCode: '<!-- Add audio here -->',
      validationRegex: '<audio\s+[^>]*controls[^>]*>\s*<source\s+[^>]*src\s*=\s*["\'][^"\']*/html/horse\.ogg["\'][^>]*>',
      solution: '<audio controls>\n  <source src="https://www.w3schools.com/html/horse.ogg" type="audio/ogg">\n</audio>',
      successMessage: 'Perfect! You have successfully added audio to your HTML page.'
    },
    {
      id: 'html-l2-q8',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Additional Video Practice',
      description: '### Qs8. Video Embedding Practice\nNow practice embedding a video with multiple format sources for broader browser compatibility. Use the video URL: https://www.w3schools.com/html/mov_bbb.mp4 and add a fallback source.\n\nMake sure to include the `controls`, `width`, and `height` attributes.\n\n**Practice Link**: [W3Schools Video Tag](https://www.w3schools.com/tags/tag_video.asp)',
      initialCode: '<!-- Add video with multiple sources here -->',
      validationRegex: '<video\s+[^>]*controls[^>]*>\s*<source\s+[^>]*src\s*=\s*["\'][^"\']*/html/mov_bbb\.mp4["\'][^>]*>\s*<source',
      solution: '<video width="320" height="240" controls>\n  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">\n  <source src="movie.webm" type="video/webm">\n  Your browser does not support the video tag.\n</video>',
      successMessage: 'Great! You have successfully added a video with multiple sources for compatibility.'
    },
    {
      id: 'html-l2-q9',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Additional Audio Practice',
      description: '### Qs9. Audio Embedding Practice\nPractice embedding audio with multiple format sources. Use the audio URL: https://www.w3schools.com/html/horse.ogg and add a fallback source.\n\nMake sure to include the `controls` attribute.\n\n**Practice Link**: [W3Schools Audio Tag](https://www.w3schools.com/tags/tag_audio.asp)',
      initialCode: '<!-- Add audio with multiple sources here -->',
      validationRegex: '<audio\s+[^>]*controls[^>]*>\s*<source\s+[^>]*src\s*=\s*["\'][^"\']*/html/horse\.ogg["\'][^>]*>\s*<source',
      solution: '<audio controls>\n  <source src="https://www.w3schools.com/html/horse.ogg" type="audio/ogg">\n  <source src="horse.mp3" type="audio/mpeg">\n  Your browser does not support the audio tag.\n</audio>',
      successMessage: 'Perfect! You have successfully added audio with multiple sources for compatibility.'
    },
    {
      id: 'html-l2-q10',
      subjectId: 'html',
      level: 2,
      title: 'L2: Media - Image, Video and Audio Review',
      description: '### Qs10. Media Integration Review\nCombine all media elements: embed an image, video, and audio file using the following URLs:\n- Image: https://www.w3schools.com/tags/img_girl.jpg\n- Video: https://www.w3schools.com/html/mov_bbb.mp4\n- Audio: https://www.w3schools.com/html/horse.ogg\n\nInclude appropriate attributes for each.\n\n**Practice Link**: [W3Schools Media Tags](https://www.w3schools.com/html/html5_video.asp)',
      initialCode: '<!-- Add image, video, and audio elements here -->',
      validationRegex: '<img[^>]*src[^>]*img_girl\.jpg[^>]*>\s*<video[^>]*controls[^>]*>\s*<source[^>]*mov_bbb\.mp4[^>]*>\s*<audio[^>]*controls[^>]*>\s*<source[^>]*horse\.ogg',
      solution: '<img src="https://www.w3schools.com/tags/img_girl.jpg" alt="Sample Girl Image"><br>\n<video width="320" height="240" controls>\n  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">\n  Your browser does not support the video tag.\n</video><br>\n<audio controls>\n  <source src="https://www.w3schools.com/html/horse.ogg" type="audio/ogg">\n  Your browser does not support the audio tag.\n</audio>',
      successMessage: 'Excellent! You have successfully integrated all media types: image, video, and audio.'
    },
    {
      id: 'html-l2-q11',
      subjectId: 'html',
      level: 2,
      title: 'L2: Legal Entities',
      description: '### Qs11. Copyright & Trademark\nLegal symbols require specific entities. Print the symbols for **copyright** and **trademark** on your page.\n\n**Practice Link**: [W3Schools Character Entities](https://www.w3schools.com/html/html_entities.asp)',
      initialCode: '<!-- Print entities here -->',
      validationRegex: '&copy;[\s\S]*&trade;',
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
  const practices = {
    py: [
      { id: 'py-pep8', title: 'Follow PEP 8', description: 'PEP 8 is the official style guide for Python. Adhering to it makes your code more readable. (No code needed, just a principle to remember).', solution: '# Follow PEP 8', validationRegex: /PEP 8/ },
      { id: 'py-vars', title: 'Meaningful Variable Names', description: 'Use descriptive names for variables. Instead of `un`, use `user_name`. Declare `user_name = "Atiq"`', solution: 'user_name = "Atiq"', validationRegex: /user_name/ },
      { id: 'py-comments', title: 'Explain "Why", Not "What"', description: 'Write comments to clarify complex logic, not to state the obvious. `# Calculate area` is less useful than `# Area calculation based on trapezoid formula`.', solution: '# This is a good comment', validationRegex: /#(.+)/ },
      { id: 'py-comprehensions', title: 'List Comprehensions', description: 'Use list comprehensions for concise list creation. Create a list of squares from 0 to 9.', solution: 'squares = [x**2 for x in range(10)]', validationRegex: /\[.*for.*in.*\]/ },
      { id: 'py-exceptions', title: 'Handle Exceptions Explicitly', description: 'Avoid bare `except:` blocks. Catch specific exceptions. Use a `try...except ValueError` block.', solution: 'try:\n  int("a")\nexcept ValueError:\n  print("Caught it!")', validationRegex: /except ValueError/ },
      { id: 'py-with', title: 'Use `with` for Resources', description: '`with` statements ensure resources are properly managed. Open a file named `test.txt` for writing.', solution: 'with open("test.txt", "w") as f:\n  f.write("hello")', validationRegex: /with open/ },
      { id: 'py-imports', title: 'Imports at the Top', description: 'Place all imports at the top of your `.py` file. Import the `math` module.', solution: 'import math', validationRegex: /import math/ },
      { id: 'py-venv', title: 'Use Virtual Environments', description: 'Virtual environments isolate project dependencies. (Conceptual - no code to write here).', solution: '# python -m venv myenv', validationRegex: /venv/ },
      { id: 'py-functions', title: 'Singular Purpose Functions', description: 'Functions should do one thing well. Define a function `add(a, b)` that returns their sum.', solution: 'def add(a, b):\n  return a + b', validationRegex: /def add/ },
      { id: 'py-fstrings', title: 'F-Strings for Formatting', description: 'Use f-strings for easy string formatting (Python 3.6+). Create a string "Hello, Atiq".', solution: 'name = "Atiq"\nf"Hello, {name}"', validationRegex: /f"/ },
      { id: 'py-default-args', title: 'Avoid Mutable Default Arguments', description: 'Using mutable default arguments can lead to unexpected behavior. (Conceptual).', solution: '# def my_func(my_list=[]): # Bad\n#   ...', validationRegex: /# Bad/ },
      { id: 'py-enumerate', title: 'Use `enumerate`', description: 'Use `enumerate` to get both index and value from a list. Loop over `["a", "b"]` and print index and value.', solution: 'for i, v in enumerate(["a", "b"]):\n  print(i, v)', validationRegex: /enumerate/ },
      { id: 'py-throwaway', title: 'Use `_` for Throwaway Variables', description: 'If you dont need a variable, use `_`. Unpack `(1, 2)` into `x` and a throwaway.', solution: 'x, _ = (1, 2)', validationRegex: /x, _/ },
      { id: 'py-none', title: 'Check for `None` with `is`', description: 'Use `is None` or `is not None`. Check if `my_var` is None.', solution: 'my_var = None\nif my_var is None:\n  print("It is None.")', validationRegex: /is None/ },
      { id: 'py-docstrings', title: 'Use Docstrings', description: 'Document your functions with docstrings. Add a docstring to a sample function.', solution: 'def my_func():\n  """This is a docstring."""\n  pass', validationRegex: /"""/ },
    ],
    js: [
      { id: 'js-const', title: 'Use `const` by Default', description: 'Use `const` for variables that won\'t be reassigned. Declare a constant `API_KEY`.', solution: 'const API_KEY = "12345";', validationRegex: /const/ },
      { id: 'js-strict', title: 'Use Strict Mode', description: '`\'use strict\';` helps catch common errors. Add it to the top of your script.', solution: "'use strict';", validationRegex: /'use strict';/ },
      { id: 'js-equality', title: 'Use Strict Equality (`===`)', description: '`===` prevents type coercion. Compare `5` and `"5"`.', solution: '5 === "5"; // false', validationRegex: /===/ },
      { id: 'js-arrow', title: 'Use Arrow Functions', description: 'Arrow functions offer shorter syntax. Create an arrow function `add` that takes two arguments.', solution: 'const add = (a, b) => a + b;', validationRegex: /=>/ },
      { id: 'js-template', title: 'Use Template Literals', description: 'Template literals are better for string concatenation. Create "Hello, Atiq".', solution: 'const name = "Atiq";\n`Hello, ${name}`;', validationRegex: /`/ },
      { id: 'js-no-globals', title: 'Avoid Global Variables', description: 'Globals can cause conflicts. Wrap your code in an IIFE (Immediately Invoked Function Expression) to create a private scope.', solution: '(function() {\n  let myVar = "secret";\n})();', validationRegex: /function\(\)/ },
      { id: 'js-modules', title: 'Modularize with `import`/`export`', description: 'Use ES6 modules to organize code. (Conceptual for this editor).', solution: '// export const myVar = 5;\n// import { myVar } from "./file.js";', validationRegex: /export|import/ },
      { id: 'js-async', title: 'Use `async/await`', description: 'Handle asynchronous operations cleanly with `async/await`.', solution: 'async function fetchData() {\n  // const data = await fetch(url);\n}', validationRegex: /async function/ },
      { id: 'js-destructure', title: 'Destructure Objects/Arrays', description: 'Access properties cleanly. Destructure `name` from `{ name: "Atiq" }`.', solution: 'const { name } = { name: "Atiq" };', validationRegex: /\{.*?\}/ },
      { id: 'js-spread', title: 'Use Spread Syntax (`...`)', description: 'Easily copy or merge arrays/objects. Copy an array `[1, 2, 3]`.', solution: 'const arr1 = [1, 2, 3];\nconst arr2 = [...arr1];', validationRegex: /\.\.\./ },
      { id: 'js-promises', title: 'Handle Promise Errors', description: 'Always attach a `.catch()` to handle potential errors in Promises.', solution: 'fetch("url").catch(err => console.error(err));', validationRegex: /\.catch/ },
      { id: 'js-array-methods', title: 'Use Modern Array Methods', description: 'Use `map`, `filter`, `reduce` over manual loops. Double every number in `[1, 2, 3]` using `map`.', solution: '[1, 2, 3].map(n => n * 2);', validationRegex: /\.map/ },
      { id: 'js-lint', title: 'Use a Linter', description: 'Linters (like ESLint) enforce code quality. (Conceptual).', solution: '// npx eslint . --fix', validationRegex: /eslint/ },
      { id: 'js-truthy', title: 'Understand Truthy/Falsy', description: 'Know what evaluates to `true` or `false` in conditionals. Check if an empty string is falsy.', solution: 'if (!"") {\n  console.log("falsy");\n}', validationRegex: /!""/ },
      { id: 'js-no-new-primitive', title: 'Avoid `new` on Primitives', description: 'Don\'t use `new String()`, `new Number()`, or `new Boolean()`.', solution: 'const str = "hello"; // Not new String("hello")', validationRegex: /"hello"/ },
    ],
    css: [
      { id: 'css-reset', title: 'Use a CSS Reset', description: 'Resets ensure browser consistency. (Conceptual).', solution: '/* Use normalize.css or a custom reset */', validationRegex: /reset/ },
      { id: 'css-bem', title: 'Use BEM or a Naming Convention', description: 'BEM (Block, Element, Modifier) makes CSS scalable. `.card__title--large`', solution: '.card {} \n.card__title {} \n.card__title--large {}', validationRegex: /__/ },
      { id: 'css-classes', title: 'Use Classes, Not IDs for Styling', description: 'Keep IDs for JS hooks. Use classes for styles. Style a `.user-profile`.', solution: '.user-profile { color: blue; }', validationRegex: /\.user-profile/ },
      { id: 'css-specificity', title: 'Avoid Overly Specific Selectors', description: 'Long selectors are brittle. Instead of `.nav ul li a`, use a class like `.nav-link`.', solution: '.nav-link { text-decoration: none; }', validationRegex: /\.nav-link/ },
      { id: 'css-relative-units', title: 'Use Relative Units', description: 'Use `rem` for fonts and `em` for context-based spacing. Set font size to `1.2rem`.', solution: 'body { font-size: 1.2rem; }', validationRegex: /rem/ },
      { id: 'css-no-important', title: 'Minimize `!important`', description: '`!important` is a last resort. Avoid it.', solution: '/* Try to increase specificity instead */', validationRegex: /specificity/ },
      { id: 'css-shorthand', title: 'Use Shorthand Properties', description: 'Use shorthand for `margin`, `padding`, etc. Set a margin of `10px 20px`.', solution: '.box { margin: 10px 20px; }', validationRegex: /margin: \d+px \d+px/ },
      { id: 'css-flexbox-grid', title: 'Use Flexbox or Grid for Layout', description: 'They are modern and powerful. Make a container a flex container.', solution: '.container { display: flex; }', validationRegex: /display: flex/ },
      { id: 'css-dry', title: 'Keep Code DRY', description: "Don't Repeat Yourself. Use utility classes or preprocessor mixins.", solution: '.text-center { text-align: center; }', validationRegex: /text-align/ },
      { id: 'css-a11y', title: 'Design for Accessibility', description: 'Ensure good color contrast and add `:focus` states.', solution: 'a:focus { outline: 2px solid blue; }', validationRegex: /:focus/ },
      { id: 'css-transforms', title: 'Animate `transform` and `opacity`', description: 'These are GPU-accelerated and performant. Animate a `transform`.', solution: '.thing { transition: transform 0.3s ease; }', validationRegex: /transition: transform/ },
      { id: 'css-clamp', title: 'Use `clamp()` for Fluidity', description: '`clamp()` provides fluid typography/spacing. `font-size: clamp(1rem, 2.5vw, 1.5rem);`', solution: 'h1 { font-size: clamp(1rem, 2.5vw, 1.5rem); }', validationRegex: /clamp/ },
      { id: 'css-lvha', title: 'Order Link Pseudo-classes', description: 'Set link styles in this order: :link, :visited, :hover, :active (LVHA).', solution: 'a:link {} a:visited {} a:hover {} a:active {}', validationRegex: /:link.*:visited.*:hover.*:active/ },
      { id: 'css-max-width', title: 'Use `max-width` on Images', description: 'Prevents images from breaking layouts on small screens.', solution: 'img { max-width: 100%; height: auto; }', validationRegex: /max-width: 100%/ },
      { id: 'css-comments', title: 'Comment Your CSS', description: 'Explain complex selectors or `z-index` stacking contexts.', solution: '/* Complex component ----- */', validationRegex: /\/\*.*\*\// },
    ]
  };

  Object.values(practices).forEach((subjectPractices, i) => {
    const subjectId = Object.keys(practices)[i];
    subjectPractices.forEach(p => {
      lessons.push({
        id: p.id,
        subjectId: subjectId,
        level: 1,
        completed: false,
        title: p.title,
        description: `### Best Practice\n${p.description}`,
        initialCode: `# Practice: ${p.title}`,
        validationRegex: p.validationRegex.source,
        solution: p.solution,
        successMessage: `Great! You've applied the "${p.title}" best practice.`
      } as Lesson)
    });
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