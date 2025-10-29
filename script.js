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

// --- 상태 공간 트리 클래스 ---
class StateTree {
    constructor(container) {
        this.container = container;
        this.itemMap = ['👨‍🌾', '🐺', '🐑', '🥬'];
        this.initialState = [0, 0, 0, 0];
        this.goalState = [1, 1, 1, 1];
        this.nodes = new Map(); // 모든 노드 정보 저장
        this.adj = new Map(); // 인접 리스트 (자식 노드들)
        this.buildTree();
    }

    isInvalid(state) {
        const [farmer, wolf, sheep, cabbage] = state;
        if (farmer !== wolf && farmer !== sheep && wolf === sheep) return true;
        if (farmer !== sheep && farmer !== cabbage && sheep === cabbage) return true;
        return false;
    }

    getNextStates(state) {
        const [farmer] = state;
        const nextStates = [];
        const possibleMoves = [-1, 0, 1, 2]; // -1: 농부만, 0: 늑대, 1: 양, 2: 양배추

        for (const move of possibleMoves) {
            const newState = [...state];
            const newFarmerPos = 1 - farmer;
            
            if (move === -1) {
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

    buildTree() {
        const queue = [{ state: this.initialState, level: 0 }];
        const visited = new Set([this.initialState.toString()]);

        this.nodes.set(this.initialState.toString(), {
            state: this.initialState,
            level: 0,
            invalid: this.isInvalid(this.initialState)
        });
        this.adj.set(this.initialState.toString(), []);

        while (queue.length > 0) {
            const { state, level } = queue.shift();
            const isNodeInvalid = this.isInvalid(state);

            if (isNodeInvalid) continue;

            const nextStates = this.getNextStates(state);
            for (const next of nextStates) {
                const nextStr = next.toString();
                if (!visited.has(nextStr)) {
                    visited.add(nextStr);
                    const childNode = {
                        state: next,
                        level: level + 1,
                        invalid: this.isInvalid(next)
                    };
                    this.nodes.set(nextStr, childNode);
                    this.adj.set(nextStr, []);
                    
                    if (!this.adj.has(state.toString())) {
                        this.adj.set(state.toString(), []);
                    }
                    this.adj.get(state.toString()).push(nextStr);
                    
                    queue.push({ state: next, level: level + 1 });
                }
            }
        }
    }

    render() {
        this.container.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tree-lines');
        this.container.appendChild(svg);

        const rootNodeData = this.nodes.get(this.initialState.toString());
        const rootElement = this.createNodeElement(rootNodeData);
        
        const levelContainer = document.createElement('div');
        levelContainer.className = 'tree-level';
        levelContainer.style.top = '20px';
        levelContainer.appendChild(rootElement);
        this.container.appendChild(levelContainer);
    }

    createNodeElement(nodeData) {
        const { state, invalid } = nodeData;
        const stateStr = state.toString();
        const nodeDiv = document.createElement('div');
        nodeDiv.id = `node-${stateStr}`;
        nodeDiv.className = 'tree-node';
        nodeDiv.dataset.state = stateStr;
        nodeDiv.dataset.level = nodeData.level;

        if (invalid) nodeDiv.classList.add('invalid-node');
        if (stateStr === this.goalState.toString()) nodeDiv.classList.add('goal-state');
        
        const [farmer, wolf, sheep, cabbage] = state;
        const leftItems = [wolf, sheep, cabbage].map((pos, i) => pos === 0 ? this.itemMap[i+1] : '').join('');
        const rightItems = [wolf, sheep, cabbage].map((pos, i) => pos === 1 ? this.itemMap[i+1] : '').join('');
        const boat = farmer === 0 ? `| 👨‍🌾<-- |` : `| -->👨‍🌾 |`;
        
        nodeDiv.innerHTML = `<span>[${leftItems}]</span> <span class="font-mono">${boat}</span> <span>[${rightItems}]</span>`;
        
        nodeDiv.addEventListener('click', (e) => this.handleNodeClick(e));
        
        return nodeDiv;
    }

    handleNodeClick(event) {
        const parentNode = event.currentTarget;
        const parentState = parentNode.dataset.state;

        if (parentNode.classList.contains('expanded')) {
            this.collapseNode(parentNode);
            return;
        }
        
        const childrenStates = this.adj.get(parentState) || [];
        if (childrenStates.length === 0) return;

        parentNode.classList.add('expanded');

        const parentRect = parentNode.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const parentLevel = parseInt(parentNode.dataset.level);

        const childLevelContainerId = `level-${parentLevel + 1}`;
        let childLevelContainer = document.getElementById(childLevelContainerId);
        if (!childLevelContainer) {
            childLevelContainer = document.createElement('div');
            childLevelContainer.id = childLevelContainerId;
            childLevelContainer.className = 'tree-level';
            this.container.appendChild(childLevelContainer);
        }
        
        const childrenElements = [];
        for (const childState of childrenStates) {
            const childNodeData = this.nodes.get(childState);
            const childElement = this.createNodeElement(childNodeData);
            childElement.dataset.parent = parentState;
            childLevelContainer.appendChild(childElement);
            childrenElements.push(childElement);
        }
        
        setTimeout(() => {
            this.drawLines(parentNode, childrenElements);
            this.repositionNodes();
        }, 0);
    }
    
    collapseNode(parentNode) {
        parentNode.classList.remove('expanded');
        const parentState = parentNode.dataset.state;
        const children = document.querySelectorAll(`.tree-node[data-parent='${parentState}']`);
        
        children.forEach(child => {
            this.collapseNode(child); // Recursively collapse grandchildren
            child.parentElement.removeChild(child);
        });

        const lines = document.querySelectorAll(`line[data-parent-id='node-${parentState}']`);
        lines.forEach(line => line.parentElement.removeChild(line));
        
        this.repositionNodes();
    }

    drawLines(parent, children) {
        const svg = this.container.querySelector('.tree-lines');
        const containerRect = this.container.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        for (const child of children) {
            const childRect = child.getBoundingClientRect();
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            
            line.setAttribute('x1', parentRect.left + parentRect.width / 2 - containerRect.left);
            line.setAttribute('y1', parentRect.bottom - containerRect.top);
            line.setAttribute('x2', childRect.left + childRect.width / 2 - containerRect.left);
            line.setAttribute('y2', childRect.top - containerRect.top);
            line.setAttribute('stroke', '#9ca3af');
            line.setAttribute('stroke-width', '2');
            line.dataset.parentId = parent.id;
            line.dataset.childId = child.id;
            svg.appendChild(line);
        }
    }
    
    repositionNodes() {
        const levels = new Map();
        this.container.querySelectorAll('.tree-level').forEach(levelDiv => {
            const level = levelDiv.id ? parseInt(levelDiv.id.split('-')[1]) : 0;
            if (!isNaN(level)) {
                levels.set(level, Array.from(levelDiv.children));
            }
        });

        const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
        let yOffset = 40;

        for (const level of sortedLevels) {
            const nodes = levels.get(level);
            if (nodes.length === 0) {
                nodes.parentElement?.remove();
                continue;
            };

            const levelDiv = nodes[0].parentElement;
            levelDiv.style.position = 'absolute';
            levelDiv.style.top = `${yOffset}px`;
            levelDiv.style.left = '50%';
            levelDiv.style.transform = 'translateX(-50%)';
            
            yOffset += 120; // Increase vertical gap
        }
        
        // Redraw all lines
        const svg = this.container.querySelector('.tree-lines');
        svg.innerHTML = '';
        const allNodes = this.container.querySelectorAll('.tree-node.expanded');
        allNodes.forEach(parentNode => {
            const parentState = parentNode.dataset.state;
            const childrenElements = this.container.querySelectorAll(`.tree-node[data-parent='${parentState}']`);
            if (childrenElements.length > 0) {
                this.drawLines(parentNode, Array.from(childrenElements));
            }
        });
    }
}

let stateTreeInstance = null;
function generateAndDisplayTree() {
    treeContainer.innerHTML = '';
    stateTreeInstance = new StateTree(treeContainer);
    stateTreeInstance.render();
}


// --- 이벤트 리스너 연결 ---
moveButton.addEventListener('click', handleMoveBoat);
resetButton.addEventListener('click', initializeGame);

// --- 초기화 ---
initializeGame();
setupTabs();
