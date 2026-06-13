// Script to extract question data from index.backup.html
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.backup.html'), 'utf-8');

// Extract JSON between the script tags
const startMarker = '<script  type="application/json" id="question-data">';
const endMarker = '</script>';

const startIdx = html.indexOf(startMarker) + startMarker.length;
const endIdx = html.indexOf(endMarker, startIdx);

const jsonStr = html.substring(startIdx, endIdx).trim();

try {
  const data = JSON.parse(jsonStr);
  
  // Category keywords mapping
  const categoryKeywords = {
    'Software Engineering': ['software evolution', 'maintenance', 'corrective', 'perfective', 'adaptive', 'preventive', 'SDLC', 'waterfall', 'incremental', 'prototyping', 'agile', 'scrum', 'requirement', 'elicitation', 'SRS', 'specification', 'traceability', 'code smell', 'refactoring', 'reengineering', 'reverse engineering', 'forward engineering', 'McCall'],
    'Artificial Intelligence': ['AI', 'artificial intelligence', 'heuristic', 'search algorithm', 'fuzzy logic', 'machine learning', 'neural network', 'backpropagation', 'overfitting', 'cross-validation', 'classification', 'supervised', 'unsupervised', 'reinforcement learning', 'agent', 'learning agent', 'TSP', 'problem solving', 'completeness', 'optimality'],
    'Operating Systems': ['operating system', 'page fault', 'paging', 'segmentation', 'memory partition', 'process', 'CPU-bound', 'I/O burst', 'CPU burst', 'scheduling', 'semaphore', 'deadlock', 'FAT', 'file system', 'buffering', 'caching', 'spooling', 'virtual memory', 'page replacement', 'Second Chance', 'worst-fit', 'best-fit', 'first-fit', 'layered operating system', 'thread', 'mutex', 'critical section', 'kernel'],
    'Computer Networking': ['OSI', 'TCP', 'UDP', 'IP address', 'subnet', 'DHCP', 'DNS', 'HTTP', 'SMTP', 'transport layer', 'network layer', 'presentation layer', 'session layer', 'data link', 'topology', 'star topology', 'bus topology', 'ring topology', 'mesh topology', 'CRC', 'parity', 'routing', 'switch', 'router', 'VLAN', 'IPv4', 'IPv6', 'port number', 'protocol number', 'LAN', 'WAN', 'firewall'],
    'Information Security': ['encryption', 'symmetric key', 'asymmetric', 'RSA', 'AES', 'vulnerability', 'countermeasure', 'security', 'confidentiality', 'integrity', 'availability', 'authentication', 'authorization', 'cipher', 'hash', 'digital signature', 'certificate', 'PKI', 'malware', 'phishing', 'penetration testing', 'vulnerability scanning'],
    'Software Architecture & Design': ['architectural pattern', 'MVC', 'microservices', 'monolithic', 'layered architecture', 'component-based', 'design pattern', 'observer', 'singleton', 'strategy', 'chain of responsibility', 'adapter', 'factory', 'decorator', 'facade', 'SOA', 'client-server', 'redundant', 'high availability', 'scalability'],
    'Software Testing & QA': ['testing', 'test case', 'white-box', 'black-box', 'selenium', 'unit test', 'integration test', 'acceptance test', 'quality assurance', 'QA', 'quality control', 'review process', 'ISO 9000', 'usability', 'defect', 'bug', 'regression'],
    'Programming Fundamentals': ['identifier', 'array', 'pointer', 'C++', 'data type', 'loop', 'function', 'variable', 'operator', 'new operator', 'memory allocation', 'struct', 'enum', 'switch', 'break', 'continue', 'ifstream', 'ofstream', 'recursive', 'recursion', 'modular programming', 'dynamic allocation', 'strcpy', 'assignment operator'],
    'Object-Oriented Programming': ['OOP', 'class', 'object', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'extends', 'implements', 'interface', 'abstract class', 'overriding', 'overloading', 'super class', 'subclass', 'Java', 'JavaFX', 'static block', 'private', 'protected', 'public'],
    'Data Structures & Algorithms': ['stack', 'queue', 'linked list', 'tree', 'BST', 'binary search', 'hash table', 'heap', 'graph', 'dequeue', 'priority queue', 'circular queue', 'sorting', 'bubble sort', 'merge sort', 'quick sort', 'insertion sort', 'selection sort', 'time complexity', 'space complexity', 'O(n)', 'O(log', 'Big-O', 'ADT', 'traversal', 'BFS', 'DFS', 'inorder', 'preorder', 'postorder', 'AVL'],
    'Database Systems': ['database', 'SQL', 'DDL', 'DML', 'schema', 'normalization', '1NF', '2NF', '3NF', 'BCNF', 'ACID', 'transaction', 'commit', 'rollback', 'savepoint', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'foreign key', 'primary key', 'relational', 'ER diagram', 'entity', 'attribute', 'ODL', 'COUNT', 'SUM', 'GROUP BY', 'aggregate'],
    'Web Development': ['HTML', 'CSS', 'JavaScript', 'hyperlink', 'form element', 'pseudo-class', 'hover', 'border-style', 'responsive', 'DOM', 'AJAX', 'JSON', 'REST', 'WebSocket', 'web browser', 'anchor', 'link element', 'style element', 'script element'],
    'Mobile Development': ['android', 'Android Studio', 'manifest', 'Gradle', 'activity', 'broadcast receiver', 'content provider', 'service', 'intent', 'layout', 'mobile app'],
    'Information Systems': ['information system', 'procedure', 'MIS', 'DSS', 'ERP', 'e-commerce', 'data warehouse', 'business intelligence'],
    'Compiler Design': ['compiler', 'lexical analysis', 'syntax analysis', 'semantic analysis', 'parser', 'grammar', 'parse tree', 'token', 'CFG', 'BNF', 'FIRST', 'FOLLOW', 'LL', 'LR', 'shift-reduce', 'regular expression', 'automata', 'NFA', 'DFA', 'pushdown automata'],
    'Digital Logic & Computer Architecture': ['logic gate', 'Boolean', 'flip-flop', 'register', 'ALU', 'CPU architecture', 'pipeline', 'cache memory', 'addressing mode', 'instruction set', 'bus architecture', 'multiplexer', 'decoder', 'encoder'],
    'Discrete Mathematics & Theory': ['set theory', 'relation', 'function', 'graph theory', 'combinatorics', 'probability', 'propositional logic', 'predicate logic', 'proof', 'induction', 'recurrence', 'Turing machine', 'halting problem', 'decidability', 'NP-complete']
  };

  function categorizeQuestion(q) {
    const text = (q.question + ' ' + q.choices.map(c => c.value).join(' ')).toLowerCase();
    
    let bestCategory = 'General';
    let bestScore = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }

  // Descriptive names mapping
  const examNames = {
    'question data': 'Comprehensive Exit Exam I',
    'questiondata_2': 'Mixed Practice Set II',
    'questiondata_3': 'Mixed Practice Set III',
    'questiondata_4': 'Mixed Practice Set IV',
    'questiondata_5': 'Mixed Practice Set V',
    'questiondata_6': 'Mixed Practice Set VI',
    'questiondata_8': 'Mixed Practice Set VIII',
    'questiondata_9': 'Mixed Practice Set IX',
    'questiondata_10': 'Mixed Practice Set X',
    'questiondata_11': 'Mixed Practice Set XI',
    'questiondata_12': 'Mixed Practice Set XII',
    'questiondata_13': 'Mixed Practice Set XIII',
    'questiondata_14': 'Mixed Practice Set XIV',
    'questiondata_15': 'Mixed Practice Set XV',
    'questiondata_16': 'Mixed Practice Set XVI',
  };

  const processedData = data.map((examSet, idx) => {
    const originalTitle = examSet.title.trim();
    const descriptiveName = examNames[originalTitle] || `Exam Set ${idx + 1}`;
    
    // Categorize each question
    const categorizedQuestions = examSet.questions.map((q, qIdx) => ({
      id: `${originalTitle}_q${qIdx}`,
      question: q.question,
      choices: q.choices.map((c, cIdx) => ({
        id: `${originalTitle}_q${qIdx}_c${cIdx}`,
        value: c.value,
        isCorrect: c.evaluation === 'correct'
      })),
      category: categorizeQuestion(q)
    }));

    // Get unique categories in this exam set
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

  // Print summary
  console.log('=== Extraction Summary ===');
  processedData.forEach(exam => {
    console.log(`\n${exam.title}: ${exam.questionCount} questions`);
    const catCounts = {};
    exam.questions.forEach(q => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    });
    Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
  });

  // Write to JS file
  const outputPath = path.join(__dirname, 'client', 'src', 'data', 'examData.js');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  const jsContent = `// Auto-generated from index.html — ${new Date().toISOString()}
// Total: ${processedData.reduce((sum, e) => sum + e.questionCount, 0)} questions across ${processedData.length} exam sets

const examData = ${JSON.stringify(processedData, null, 2)};

export default examData;

// All unique categories
export const ALL_CATEGORIES = ${JSON.stringify([...new Set(processedData.flatMap(e => e.categories))].sort(), null, 2)};

// Category metadata with icons (lucide icon names)
export const CATEGORY_META = {
  'Software Engineering': { icon: 'Settings', color: '#6366f1', description: 'SDLC, maintenance, requirements, re-engineering' },
  'Artificial Intelligence': { icon: 'Brain', color: '#8b5cf6', description: 'ML, neural networks, search algorithms, agents' },
  'Operating Systems': { icon: 'Monitor', color: '#06b6d4', description: 'Memory management, scheduling, file systems' },
  'Computer Networking': { icon: 'Network', color: '#0ea5e9', description: 'OSI model, TCP/UDP, subnetting, protocols' },
  'Information Security': { icon: 'Shield', color: '#ef4444', description: 'Encryption, vulnerabilities, security goals' },
  'Software Architecture & Design': { icon: 'Building2', color: '#f59e0b', description: 'Design patterns, MVC, microservices' },
  'Software Testing & QA': { icon: 'TestTube', color: '#10b981', description: 'Test cases, QA processes, quality standards' },
  'Programming Fundamentals': { icon: 'Code', color: '#3b82f6', description: 'C++, arrays, pointers, control flow' },
  'Object-Oriented Programming': { icon: 'Boxes', color: '#ec4899', description: 'Java, classes, inheritance, polymorphism' },
  'Data Structures & Algorithms': { icon: 'GitBranch', color: '#14b8a6', description: 'Stacks, queues, trees, sorting, complexity' },
  'Database Systems': { icon: 'Database', color: '#f97316', description: 'SQL, normalization, transactions, schemas' },
  'Web Development': { icon: 'Globe', color: '#a855f7', description: 'HTML, CSS, JavaScript, web standards' },
  'Mobile Development': { icon: 'Smartphone', color: '#22c55e', description: 'Android, activities, manifest, components' },
  'Information Systems': { icon: 'BarChart3', color: '#64748b', description: 'MIS, business intelligence, procedures' },
  'Compiler Design': { icon: 'FileCode', color: '#e11d48', description: 'Lexical analysis, parsing, grammars' },
  'General': { icon: 'BookOpen', color: '#78716c', description: 'General computing topics' },
};
`;

  fs.writeFileSync(outputPath, jsContent);
  console.log(`\n✅ Written to ${outputPath}`);
  console.log(`Total questions: ${processedData.reduce((sum, e) => sum + e.questionCount, 0)}`);
  console.log(`Total exam sets: ${processedData.length}`);

} catch (e) {
  console.error('Parse error:', e.message);
  // Try to find the position
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = Number(match[1]);
    const context = jsonStr.substring(Math.max(0, pos - 100), pos + 100);
    console.error('Context around error:', context);
  }
}
