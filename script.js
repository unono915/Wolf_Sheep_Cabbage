// --- DOM 요소 가져오기 ---
const leftBank = document.getElementById('left-bank');
const rightBank = document.getElementById('right-bank');
const boatElement = document.getElementById('boat');
const boatItemContainer = document.getElementById('boat-item-container');
const moveButton = document.getElementById('move-button');
const resetButton = document.getElementById('reset-button');
const messageArea = document.getElementById('message-area');

// --- 탭 관련 요소 ---
const gameTab = document.getElementById('game-tab');
const treeTab = document.getElementById('tree-tab');
const gameContent = document.getElementById('game');
const treeContent = document.getElementById('tree');
const treeContainer = document.getElementById('tree-container');


// --- 게임 상태 관리 ---
let gameState = {};
const characters = {
    wolf: { emoji: '🐺', element: null },
    sheep: { emoji: '🐑', element: null },
    cabbage: { emoji: '🥬', element: null }
};

// --- 게임 초기화 함수 ---
function initializeGame() {
    gameState = {
        boat: 'left',
        wolf: 'left',
        sheep: 'left',
        cabbage: 'left'
    };

    leftBank.innerHTML = '';
    rightBank.innerHTML = '';
    boatItemContainer.innerHTML = '';
    messageArea.innerHTML = '';
    
    moveButton.disabled = false;
    moveButton.classList.remove('opacity-50', 'cursor-not-allowed');

    for (const id in characters) {
        const char = characters[id];
        const el = document.createElement('div');
        el.id = id;
        el.textContent = char.emoji;
        el.className = 'character text-4xl md:text-5xl';
        el.addEventListener('click', () => handleCharacterClick(id));
        char.element = el;
    }

    render();
}

// --- 렌더링 함수 ---
function render() {
    leftBank.innerHTML = '';
    rightBank.innerHTML = '';
    boatItemContainer.innerHTML = '';

    boatElement.classList.toggle('left', gameState.boat === 'left');
    boatElement.classList.toggle('right', gameState.boat === 'right');

    for (const id in gameState) {
        if (id === 'boat') continue;
        const location = gameState[id];
        const element = characters[id].element;
        if (location === 'left') leftBank.appendChild(element);
        else if (location === 'right') rightBank.appendChild(element);
        else if (location === 'boat') boatItemContainer.appendChild(element);
    }
}

// --- 캐릭터 클릭 이벤트 핸들러 ---
function handleCharacterClick(id) {
    const location = gameState[id];
    const boatHasItem = Object.keys(characters).some(key => gameState[key] === 'boat');

    if (location === gameState.boat) {
        if (!boatHasItem) {
            gameState[id] = 'boat';
        }
    } else if (location === 'boat') {
        gameState[id] = gameState.boat;
    }
    
    render();
}

// --- 강 건너기 버튼 이벤트 핸들러 ---
function handleMoveBoat() {
    gameState.boat = (gameState.boat === 'left') ? 'right' : 'left';
    render();
    setTimeout(checkGameStatus, 800);
}

// --- 게임 상태 체크 ---
function checkGameStatus() {
    const boatSide = gameState.boat;
    const otherSide = (boatSide === 'left') ? 'right' : 'left';
    const itemsOnOtherSide = Object.keys(characters).filter(id => gameState[id] === otherSide);

    let gameOver = false;
    let message = '';
    
    if (itemsOnOtherSide.includes('wolf') && itemsOnOtherSide.includes('sheep')) {
        gameOver = true;
        message = 'GAME OVER! 늑대가 양을 잡아먹었습니다... 🐺 → 🐑';
    } else if (itemsOnOtherSide.includes('sheep') && itemsOnOtherSide.includes('cabbage')) {
        gameOver = true;
        message = 'GAME OVER! 양이 양배추를 먹었습니다... 🐑 → 🥬';
    }

    if (gameOver) {
        messageArea.textContent = message;
        messageArea.classList.add('text-red-600', 'message-box');
        moveButton.disabled = true;
        moveButton.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const itemsOnRight = Object.keys(characters).filter(id => gameState[id] === 'right');
    if (itemsOnRight.length === 3) {
        message = '축하합니다! 모두 무사히 강을 건넜습니다! 🎉';
        messageArea.textContent = message;
        messageArea.classList.add('text-green-600', 'message-box');
        moveButton.disabled = true;
        moveButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// --- 탭 전환 로직 ---
function setupTabs() {
    gameTab.addEventListener('click', () => {
        gameTab.setAttribute('aria-selected', 'true');
        treeTab.setAttribute('aria-selected', 'false');
        gameContent.classList.remove('hidden');
        treeContent.classList.add('hidden');
    });

    treeTab.addEventListener('click', () => {
        treeTab.setAttribute('aria-selected', 'true');
        gameTab.setAttribute('aria-selected', 'false');
        treeContent.classList.remove('hidden');
        gameContent.classList.add('hidden');
        generateAndDisplayTree(); // 탭을 클릭할 때마다 트리 생성
    });
}

// --- 상태 공간 트리 생성 로직 ---
function generateAndDisplayTree() {
    treeContainer.innerHTML = '<div class="text-center">트리 생성 중...</div>';

    // 상태: [농부, 늑대, 양, 양배추] (0: 왼쪽, 1: 오른쪽)
    const initialState = [0, 0, 0, 0];
    const goalState = [1, 1, 1, 1];
    const itemMap = ['👨‍🌾', '🐺', '🐑', '🥬'];

    function isInvalid(state) {
        const [farmer, wolf, sheep, cabbage] = state;
        if (farmer !== wolf && farmer !== sheep && wolf === sheep) return true;
        if (farmer !== sheep && farmer !== cabbage && sheep === cabbage) return true;
        return false;
    }

    function getNextStates(state) {
        const [farmer, wolf, sheep, cabbage] = state;
        const nextStates = [];
        const possibleMoves = [-1, 0, 1, 2]; // -1: 농부만, 0: 늑대, 1: 양, 2: 양배추

        for (const move of possibleMoves) {
            const newState = [...state];
            const newFarmerPos = 1 - farmer;
            
            if (move === -1) { // 농부만 이동
                newState[0] = newFarmerPos;
            } else {
                const itemIndex = move + 1;
                if (state[itemIndex] === farmer) {
                    newState[0] = newFarmerPos;
                    newState[itemIndex] = newFarmerPos;
                } else continue;
            }
            nextStates.push(newState);
        }
        return nextStates;
    }

    // BFS로 트리 레벨 생성
    const bfsQueue = [{state: initialState, level: 0, parent: null}];
    const visited = new Set([initialState.toString()]);
    const nodesByLevel = {};

    while(bfsQueue.length > 0) {
        const {state, level, parent} = bfsQueue.shift();
        const isNodeInvalid = isInvalid(state);

        if (!nodesByLevel[level]) {
            nodesByLevel[level] = [];
        }
        nodesByLevel[level].push({state, parent, invalid: isNodeInvalid});

        if (isNodeInvalid) continue; // 실패한 노드에서는 더 이상 탐색하지 않음

        const nextStates = getNextStates(state);
        for(const next of nextStates) {
            if (!visited.has(next.toString())) {
                visited.add(next.toString());
                bfsQueue.push({state: next, level: level + 1, parent: state});
            }
        }
    }

    // 트리 렌더링
    treeContainer.innerHTML = '';
    const levels = Object.keys(nodesByLevel).sort((a, b) => a - b);

    for (const level of levels) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'tree-level';

        for (const node of nodesByLevel[level]) {
            const nodeDiv = document.createElement('div');
            const stateStr = node.state.toString();
            nodeDiv.id = `node-${stateStr}`;
            nodeDiv.className = 'tree-node';
            if (node.invalid) {
                nodeDiv.classList.add('invalid-node');
            }
            if (stateStr === goalState.toString()) {
                nodeDiv.classList.add('goal-state');
            }

            const [farmer, wolf, sheep, cabbage] = node.state;
            const leftItems = [wolf, sheep, cabbage].map((pos, i) => pos === 0 ? itemMap[i+1] : '').join('');
            const rightItems = [wolf, sheep, cabbage].map((pos, i) => pos === 1 ? itemMap[i+1] : '').join('');
            const boat = farmer === 0 ? `| 👨‍🌾<-- |` : `| -->👨‍🌾 |`;
            
            nodeDiv.innerHTML = `<span>[${leftItems}]</span> <span class="font-mono">${boat}</span> <span>[${rightItems}]</span>`;
            levelDiv.appendChild(nodeDiv);
        }
        treeContainer.appendChild(levelDiv);
    }
    
    // 간선 그리기 (SVG 사용)
    setTimeout(() => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tree-lines');
        const containerRect = treeContainer.getBoundingClientRect();

        for (const level of levels) {
            if (level === '0') continue;
            for (const node of nodesByLevel[level]) {
                if (!node.parent) continue;

                const childId = `node-${node.state.toString()}`;
                const parentId = `node-${node.parent.toString()}`;
                
                const childEl = document.getElementById(childId);
                const parentEl = document.getElementById(parentId);

                if (childEl && parentEl) {
                    const childRect = childEl.getBoundingClientRect();
                    const parentRect = parentEl.getBoundingClientRect();

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', parentRect.left + parentRect.width / 2 - containerRect.left);
                    line.setAttribute('y1', parentRect.bottom - containerRect.top);
                    line.setAttribute('x2', childRect.left + childRect.width / 2 - containerRect.left);
                    line.setAttribute('y2', childRect.top - containerRect.top);
                    line.setAttribute('stroke', '#9ca3af');
                    line.setAttribute('stroke-width', '2');
                    svg.appendChild(line);
                }
            }
        }
        treeContainer.prepend(svg);
    }, 100);
}


// --- 이벤트 리스너 연결 ---
moveButton.addEventListener('click', handleMoveBoat);
resetButton.addEventListener('click', initializeGame);

// --- 초기화 ---
initializeGame();
setupTabs();