const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.backup.html'), 'utf-8');
const startM = '<script  type="application/json" id="question-data">';
const si = html.indexOf(startM) + startM.length;
const ei = html.indexOf('</script>', si);
const data = JSON.parse(html.substring(si, ei).trim());

const categoryKeywords = {
  'Software Engineering': ['software evolution', 'maintenance', 'corrective maintenance', 'perfective maintenance', 'adaptive maintenance', 'preventive maintenance', 'sdlc', 'waterfall', 'incremental', 'prototyping', 'agile', 'scrum', 'requirement', 'elicitation', 'srs', 'specification', 'traceability', 'code smell', 'refactoring', 'reengineering', 'reverse engineering', 'forward engineering', 'mccall', 'spiral model', 'software metric', 'lines of code'],
  'Artificial Intelligence': ['artificial intelligence', 'heuristic', 'search algorithm', 'fuzzy logic', 'machine learning', 'neural network', 'backpropagation', 'overfitting', 'cross-validation', 'classification', 'supervised learning', 'unsupervised learning', 'reinforcement learning', 'learning agent', 'problem generator', 'critic', 'tsp problem', 'problem solving', 'completeness', 'optimality', 'decision tree', 'k-means', 'cognitive ai', 'computer vision', 'peas', 'task environment', 'predicate logic'],
  'Operating Systems': ['operating system', 'page fault', 'paging', 'segmentation', 'memory partition', 'cpu-bound', 'i/o burst', 'cpu burst', 'scheduling', 'semaphore', 'deadlock', 'file allocation table', 'fat file system', 'buffering', 'caching', 'spooling', 'virtual memory', 'page replacement', 'second chance', 'worst-fit', 'best-fit', 'first-fit', 'layered operating system', 'thread', 'mutex', 'critical section', 'kernel', 'round robin', 'fcfs', 'sjf', 'starvation', 'time multiplexed', 'cpu scheduling'],
  'Computer Networking': ['osi', 'tcp', 'udp', 'ip address', 'subnet', 'dhcp', 'dns', 'transport layer', 'network layer', 'presentation layer', 'session layer', 'topology', 'star topology', 'bus topology', 'ring topology', 'mesh topology', 'crc', 'cyclic redundancy', 'routing', 'vlan', 'ipv4', 'ipv6', 'port number', 'protocol number', 'lan', 'wan', 'firewall', 'gateway', 'tcp/ip model'],
  'Information Security': ['encryption', 'symmetric key', 'asymmetric', 'rsa', 'aes', 'vulnerability', 'countermeasure', 'confidentiality', 'integrity', 'availability', 'authentication', 'cipher', 'digital signature', 'malware', 'phishing', 'penetration testing', 'vulnerability scanning', 'computer security', 'security goal', 'diffie-hellman', 'decryption', 'virus', 'rbac', 'role-based access', 'input validation', 'security assurance'],
  'Software Architecture & Design': ['architectural pattern', 'mvc', 'model-view-controller', 'microservices', 'monolithic', 'layered architecture', 'component-based', 'design pattern', 'observer pattern', 'singleton', 'strategy pattern', 'chain of responsibility', 'adapter pattern', 'factory', 'decorator', 'client-server', 'redundant component', 'high availability', 'scalability', 'fault tolerance', 'loose coupling', 'open-closed principle', 'solid principle', 'architectural design', 'uml', 'class diagram', 'sequence diagram'],
  'Software Testing & QA': ['testing', 'test case', 'white-box', 'black-box', 'selenium', 'unit test', 'integration test', 'acceptance test', 'quality assurance', 'quality control', 'review process', 'iso 9000', 'usability', 'software quality', 'tester', 'regression test', 'load testing', 'stress testing', 'equivalence partitioning', 'functional testing', 'scenario-based testing', 'validation testing'],
  'Programming Fundamentals': ['valid identifier', 'array', 'pointer', 'data type', 'new operator', 'memory allocation', 'strcpy', 'ofstream', 'ifstream', 'modular programming', 'dynamic allocat', 'vehicletype', 'float num', 'c++', 'boolean', 'for loop', 'while loop', 'assignment operator', 'address operator'],
  'Object-Oriented Programming': ['class a', 'class b extends', 'extends keyword', 'implements', 'interface foo', 'abstract class', 'overriding', 'overloading', 'super class', 'subclass', 'javafx', 'static block', 'scene with dimensions', 'social networking application', 'oop', 'object-oriented', 'inheritance', 'polymorphism', 'encapsulation', 'method overrid'],
  'Data Structures & Algorithms': ['stack', 'queue', 'linked list', 'bst', 'binary search', 'hash table', 'heap', 'dequeue', 'priority queue', 'circular queue', 'time complexity', 'o(1)', 'o(n)', 'o(log', 'adt', 'reversing a word', 'data structure', 'sorting', 'bubble sort', 'merge sort', 'insertion sort', 'selection sort', 'inorder', 'preorder', 'postorder', 'avl', 'traversal', 'asymptotic'],
  'Database Systems': ['ddl', 'dml', 'schema', 'normalization', '1nf', '2nf', '3nf', 'bcnf', 'acid', 'transaction', 'commit', 'rollback', 'savepoint', 'relational', 'er diagram', 'entity', 'odl', 'aggregate', 'foreign key', 'primary key', 'data definition language', 'data manipulation language', 'sql', 'candidate key', 'functional dependency', 'database constraint', 'data warehouse', 'data mining', 'sqlitedatabase', 'projection operation', 'hierarchical model'],
  'Web Development': ['html', 'css', 'hyperlink', 'form element', 'pseudo-class', ':hover', 'border-style', 'border-width', 'anchor', 'link element', 'ajax', 'websocket', 'web browser', 'http method', 'put', 'get', 'post', 'php', 'predefined variable'],
  'Mobile Development': ['android', 'android studio', 'manifest', 'gradle', 'broadcast receiver', 'content provider', 'activity', 'sharedpreferences', 'toast.maketext', 'startactivity', 'onresume', 'oncreate', 'ondestroy'],
  'Project Management': ['project manager', 'communication plan', 'procurement', 'vendor evaluation', 'variance analysis', 'cost management', 'project scheduling', 'float', 'critical path'],
};

function categorizeQuestion(questionText) {
  const text = questionText.toLowerCase();
  let bestCategory = 'General';
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) { bestScore = score; bestCategory = category; }
  }
  return bestCategory;
}

const roman = {'2':'II','3':'III','4':'IV','5':'V','6':'VI','8':'VIII','9':'IX','10':'X','11':'XI','12':'XII','13':'XIII','14':'XIV','15':'XV','16':'XVI'};

const processedData = data.map((examSet, idx) => {
  const originalTitle = examSet.title.trim();
  let descriptiveName;
  if (originalTitle === 'question data') {
    descriptiveName = 'Comprehensive Exit Exam I';
  } else {
    const num = originalTitle.replace('questiondata_','');
    descriptiveName = 'Mixed Practice Set ' + (roman[num] || num);
  }

  const categorizedQuestions = [];
  
  examSet.questions.forEach((q, qIdx) => {
    if (!q || !q.question) return;
    
    const idBase = `${originalTitle.replace(/\s+/g,'_')}_q${qIdx}`;
    
    // Handle standard format (with choices array)
    if (q.choices && Array.isArray(q.choices) && q.choices.length > 0) {
      const fullText = q.question + ' ' + q.choices.map(c => c.value).join(' ');
      categorizedQuestions.push({
        id: idBase,
        question: q.question,
        choices: q.choices.map((c, cIdx) => ({
          id: `${idBase}_c${cIdx}`,
          value: c.value,
          isCorrect: c.evaluation === 'correct'
        })),
        category: categorizeQuestion(fullText)
      });
    }
    // Handle alternative format (questiondata_14 style with correct_answer/selected_answer)
    else if (q.correct_answer) {
      // These don't have multiple choice options, so we'll mark just the correct answer
      // We can't reconstruct the original options, but we can show the question and correct answer
      categorizedQuestions.push({
        id: idBase,
        question: q.question,
        choices: [
          { id: `${idBase}_c0`, value: q.correct_answer, isCorrect: true },
        ],
        category: categorizeQuestion(q.question + ' ' + q.correct_answer),
        isFlashcard: true // Flag to indicate this is a flashcard-type question
      });
    }
  });

  const categories = [...new Set(categorizedQuestions.map(q => q.category))].sort();
  return {
    id: originalTitle.replace(/\s+/g, '_'),
    title: `${descriptiveName} (${originalTitle})`,
    originalTitle,
    questionCount: categorizedQuestions.length,
    categories,
    questions: categorizedQuestions
  };
});

// Filter out empty exam sets
const finalData = processedData.filter(e => e.questionCount > 0);

const outputPath = path.join(__dirname, 'client', 'src', 'data', 'examData.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const allCats = [...new Set(finalData.flatMap(e => e.categories))].sort();
const totalQ = finalData.reduce((s,e) => s+e.questionCount, 0);

let jsContent = `// Auto-generated exam data
// Total: ${totalQ} questions across ${finalData.length} exam sets

const examData = ${JSON.stringify(finalData, null, 2)};

export default examData;

export const ALL_CATEGORIES = ${JSON.stringify(allCats, null, 2)};

export const CATEGORY_META = {
  "Software Engineering": { icon: "Settings", color: "#6366f1", description: "SDLC, maintenance, requirements, re-engineering" },
  "Artificial Intelligence": { icon: "Brain", color: "#8b5cf6", description: "ML, neural networks, search algorithms, agents" },
  "Operating Systems": { icon: "Monitor", color: "#06b6d4", description: "Memory management, scheduling, file systems" },
  "Computer Networking": { icon: "Network", color: "#0ea5e9", description: "OSI model, TCP/UDP, subnetting, protocols" },
  "Information Security": { icon: "Shield", color: "#ef4444", description: "Encryption, vulnerabilities, security goals" },
  "Software Architecture & Design": { icon: "Building2", color: "#f59e0b", description: "Design patterns, MVC, microservices" },
  "Software Testing & QA": { icon: "TestTube", color: "#10b981", description: "Test cases, QA processes, quality standards" },
  "Programming Fundamentals": { icon: "Code", color: "#3b82f6", description: "C++, arrays, pointers, control flow" },
  "Object-Oriented Programming": { icon: "Boxes", color: "#ec4899", description: "Java, classes, inheritance, polymorphism" },
  "Data Structures & Algorithms": { icon: "GitBranch", color: "#14b8a6", description: "Stacks, queues, trees, sorting, complexity" },
  "Database Systems": { icon: "Database", color: "#f97316", description: "SQL, normalization, transactions, schemas" },
  "Web Development": { icon: "Globe", color: "#a855f7", description: "HTML, CSS, JavaScript, web standards" },
  "Mobile Development": { icon: "Smartphone", color: "#22c55e", description: "Android, activities, manifest, components" },
  "Project Management": { icon: "ClipboardList", color: "#64748b", description: "Planning, scheduling, cost management" },
  "General": { icon: "BookOpen", color: "#78716c", description: "General computing topics" },
};
`;

fs.writeFileSync(outputPath, jsContent);
console.log(`Done! ${totalQ} questions across ${finalData.length} sets written.`);
finalData.forEach(exam => {
  const flashcards = exam.questions.filter(q => q.isFlashcard).length;
  const mcq = exam.questions.filter(q => !q.isFlashcard).length;
  console.log(`${exam.title}: ${mcq} MCQ + ${flashcards} flashcards = ${exam.questionCount} total`);
});
