// --- Configurable Relation Info ---
let relation = {
    name: 'Player',
    attributes: ['Name', 'Height', 'Gender', 'Address', 'Weight', 'DOB', 'Telephone'],
    primaryKey: 'Name'
};

let queries = [
    {
        text: 'SELECT Name, DOB, Address, Telephone FROM Player WHERE Gender = value',
        sites: [60, 0, 45]
    },
    {
        text: 'SELECT Avg (Height), Avg (Weight) FROM Player WHERE Gender = value',
        sites: [0, 5, 0]
    },
    {
        text: 'SELECT Name, Height, Weight, DOB FROM Player WHERE Name LIKE value',
        sites: [5, 7, 2]
    },
    {
        text: 'SELECT Name, Address, Telephone FROM Player WHERE Name = value',
        sites: [35, 38, 13]
    }
];

function getAttributes() {
    return relation.attributes;
}

// --- UI Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Relation info listeners
    document.getElementById('relation-name').addEventListener('input', e => {
        relation.name = e.target.value;
    });
    document.getElementById('relation-attributes').addEventListener('input', e => {
        relation.attributes = e.target.value.split(',').map(a => a.trim()).filter(a => a);
        calculateMatrices();
        initializeQueries();
    });
    document.getElementById('relation-pk').addEventListener('input', e => {
        relation.primaryKey = e.target.value;
    });
    document.getElementById('add-query-btn').addEventListener('click', addNewQuery);
    document.getElementById('reset-btn').addEventListener('click', resetAll);
    document.getElementById('view-result-btn').addEventListener('click', () => {
        document.getElementById('results-section').style.display = '';
        calculateMatrices();
    });
    initializeQueries();
    document.getElementById('results-section').style.display = 'none';
});

function initializeQueries() {
    const container = document.getElementById('queries-container');
    container.innerHTML = '';
    queries.forEach((query, index) => {
        addQueryToUI(query, index);
    });
}

function addQueryToUI(query, index) {
    const container = document.getElementById('queries-container');
    const queryDiv = document.createElement('div');
    queryDiv.className = 'query-item';
    
    const queryText = document.createElement('input');
    queryText.type = 'text';
    queryText.value = query.text;
    queryText.placeholder = 'Enter query text';
    queryText.style.width = '60%';
    queryText.addEventListener('change', (e) => {
        queries[index].text = e.target.value;
        calculateMatrices();
    });

    const sitesDiv = document.createElement('div');
    sitesDiv.style.marginTop = '10px';
    for (let i = 0; i < 3; i++) {
        const siteInput = document.createElement('input');
        siteInput.type = 'number';
        siteInput.value = query.sites[i];
        siteInput.placeholder = `Site ${i + 1}`;
        siteInput.addEventListener('change', (e) => {
            queries[index].sites[i] = parseInt(e.target.value) || 0;
            calculateMatrices();
        });
        sitesDiv.appendChild(siteInput);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
        queries.splice(index, 1);
        initializeQueries();
        calculateMatrices();
    });

    queryDiv.appendChild(queryText);
    queryDiv.appendChild(sitesDiv);
    queryDiv.appendChild(removeBtn);
    container.appendChild(queryDiv);
}

function addNewQuery() {
    queries.push({
        text: '',
        sites: [0, 0, 0]
    });
    initializeQueries();
}

function resetAll() {
    relation = {
        name: 'Player',
        attributes: ['Name', 'Height', 'Gender', 'Address', 'Weight', 'DOB', 'Telephone'],
        primaryKey: 'Name'
    };
    queries = [
        {
            text: 'SELECT Name, DOB, Address, Telephone FROM Player WHERE Gender = value',
            sites: [60, 0, 45]
        },
        {
            text: 'SELECT Avg (Height), Avg (Weight) FROM Player WHERE Gender = value',
            sites: [0, 5, 0]
        },
        {
            text: 'SELECT Name, Height, Weight, DOB FROM Player WHERE Name LIKE value',
            sites: [5, 7, 2]
        },
        {
            text: 'SELECT Name, Address, Telephone FROM Player WHERE Name = value',
            sites: [35, 38, 13]
        }
    ];
    document.getElementById('relation-name').value = relation.name;
    document.getElementById('relation-attributes').value = relation.attributes.join(',');
    document.getElementById('relation-pk').value = relation.primaryKey;
    initializeQueries();
    document.getElementById('results-section').style.display = 'none';
}

// --- Matrix Calculations ---
// Usage matrix: queries × attributes (1 if used, 0 if not)
function calculateUsageMatrix() {
    const attrs = getAttributes();
    return queries.map(query => {
        const usedAttrs = extractAttributes(query.text, attrs);
        return attrs.map(attr => usedAttrs.includes(attr) ? 1 : 0);
    });
}

// Affinity matrix: attribute × attribute
function calculateAffinityMatrix(usageMatrix) {
    const attrs = getAttributes();
    const n = attrs.length;
    const affinity = Array.from({length: n}, () => Array(n).fill(0));
    queries.forEach((query, qIdx) => {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                for (let s = 0; s < 3; s++) {
                    affinity[i][j] += usageMatrix[qIdx][i] * usageMatrix[qIdx][j] * query.sites[s];
                }
            }
        }
    });
    return affinity;
}

// Extract attributes from SQL query, including SELECT and WHERE clauses, only those in schema
function extractAttributes(query, attrs) {
    // Extract SELECT part
    const selectPart = query.split(/FROM/i)[0].replace(/SELECT/i, '').trim();
    let attributes = selectPart.split(',').map(attr => {
        const match = attr.match(/AVG\((\w+)\)/i);
        return match ? match[1] : attr.replace(/\bAvg\b|\(|\)/gi, '').trim();
    });

    // Extract WHERE part
    const whereMatch = query.match(/WHERE\s+([^;]+)/i);
    if (whereMatch) {
        // Find all attribute-like words in WHERE
        const whereAttrs = whereMatch[1].split(/\W+/).filter(w => attrs.includes(w));
        attributes = attributes.concat(whereAttrs);
    }

    // Only keep unique attributes that are in the schema
    return [...new Set(attributes.filter(attr => attrs.includes(attr)))];
}

// Clustered matrix using Bond Energy Algorithm (BEA)
function calculateClusteredMatrix(affinityMatrix) {
    const n = affinityMatrix.length;
    if (n === 0) return affinityMatrix;
    // Initial order: first two attributes
    let order = [0, 1];
    // Insert remaining attributes one by one
    for (let k = 2; k < n; k++) {
        let bestPos = 0;
        let bestBond = -Infinity;
        // Try all possible positions
        for (let pos = 0; pos <= order.length; pos++) {
            // Insert k at position pos
            const tempOrder = order.slice(0, pos).concat([k], order.slice(pos));
            // Calculate bond energy (sum of adjacent affinities)
            let bond = 0;
            for (let i = 0; i < tempOrder.length - 1; i++) {
                bond += affinityMatrix[tempOrder[i]][tempOrder[i+1]] + affinityMatrix[tempOrder[i+1]][tempOrder[i]];
            }
            if (bond > bestBond) {
                bestBond = bond;
                bestPos = pos;
            }
        }
        order.splice(bestPos, 0, k);
    }
    // Reorder the matrix
    const clustered = order.map(i => order.map(j => affinityMatrix[i][j]));
    clustered.order = order;
    return clustered;
}

// Fragments (for demo, just one fragment with all attributes)
function calculateFragments(clusteredMatrix) {
    const attrs = getAttributes();
    const order = clusteredMatrix.order || attrs.map((_, i) => i);
    const matrix = clusteredMatrix;
    const n = order.length;
    if (n < 2) return [attrs];
    let bestSq = -Infinity;
    let bestSplit = 1;
    // Try all possible splits
    for (let split = 1; split < n; split++) {
        const vf1 = order.slice(0, split);
        const vf2 = order.slice(split);
        // acc(VF1): sum of all affinities within VF1
        let acc1 = 0;
        for (let i = 0; i < vf1.length; i++) {
            for (let j = 0; j < vf1.length; j++) {
                acc1 += matrix[i][j];
            }
        }
        // acc(VF2): sum of all affinities within VF2
        let acc2 = 0;
        for (let i = 0; i < vf2.length; i++) {
            for (let j = 0; j < vf2.length; j++) {
                acc2 += matrix[split + i][split + j];
            }
        }
        // acc(VF1, VF2): sum of all affinities between VF1 and VF2
        let acc12 = 0;
        for (let i = 0; i < vf1.length; i++) {
            for (let j = 0; j < vf2.length; j++) {
                acc12 += matrix[i][split + j] + matrix[split + j][i];
            }
        }
        const sq = acc1 * acc2 - acc12 * acc12;
        if (sq > bestSq) {
            bestSq = sq;
            bestSplit = split;
        }
    }
    // Return the two fragments
    const frag1 = order.slice(0, bestSplit).map(i => attrs[i]);
    const frag2 = order.slice(bestSplit).map(i => attrs[i]);
    return [frag1, frag2];
}

// --- Display Functions ---
function displayMatrices(usageMatrix, affinityMatrix, clusteredMatrix, fragments) {
    // Usage Matrix: queries × attributes
    const usageMatrixDiv = document.getElementById('usage-matrix');
    let usageHtml = '<table><tr><th></th>';
    getAttributes().forEach(attr => usageHtml += `<th>${attr}</th>`);
    usageHtml += '</tr>';
    usageMatrix.forEach((row, i) => {
        usageHtml += `<tr><th>Q${i+1}</th>`;
        row.forEach(val => usageHtml += `<td>${val}</td>`);
        usageHtml += '</tr>';
    });
    usageHtml += '</table>';
    usageMatrixDiv.innerHTML = usageHtml;

    // Affinity Matrix
    const affinityMatrixDiv = document.getElementById('affinity-matrix');
    let affinityHtml = '<table><tr><th></th>';
    getAttributes().forEach(attr => affinityHtml += `<th>${attr}</th>`);
    affinityHtml += '</tr>';
    affinityMatrix.forEach((row, i) => {
        affinityHtml += `<tr><th>${getAttributes()[i]}</th>`;
        row.forEach(val => affinityHtml += `<td>${val}</td>`);
        affinityHtml += '</tr>';
    });
    affinityHtml += '</table>';
    affinityMatrixDiv.innerHTML = affinityHtml;

    // Clustered Matrix
    const clusteredMatrixDiv = document.getElementById('clustered-matrix');
    let clusteredHtml = '<table><tr><th></th>';
    const clusteredOrder = clusteredMatrix.order || getAttributes().map((_,i)=>i);
    clusteredOrder.forEach(i => clusteredHtml += `<th>${getAttributes()[i]}</th>`);
    clusteredHtml += '</tr>';
    clusteredOrder.forEach((i, rowIdx) => {
        clusteredHtml += `<tr><th>${getAttributes()[i]}</th>`;
        clusteredOrder.forEach((j, colIdx) => {
            clusteredHtml += `<td>${clusteredMatrix[rowIdx][colIdx]}</td>`;
        });
        clusteredHtml += '</tr>';
    });
    clusteredHtml += '</table>';
    clusteredMatrixDiv.innerHTML = clusteredHtml;

    // Fragments
    const fragmentsDiv = document.getElementById('fragments');
    let fragmentsHtml = fragments.map((frag, i) => `<div>Fragment ${i+1}: ${frag.join(', ')}</div>`).join('');
    fragmentsDiv.innerHTML = fragmentsHtml;
}

function calculateMatrices() {
    const usageMatrix = calculateUsageMatrix();
    const affinityMatrix = calculateAffinityMatrix(usageMatrix);
    const clusteredMatrix = calculateClusteredMatrix(affinityMatrix);
    const fragments = calculateFragments(clusteredMatrix);
    displayMatrices(usageMatrix, affinityMatrix, clusteredMatrix, fragments);
} 