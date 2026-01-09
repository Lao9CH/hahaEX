let students = [];
let seatGrid = [];
let settings = {
    teacherName: '',
    seatLabel: 'both',
    genderLabel: 'color',
    rows: 6,
    cols: 8
};
let draggedSeatIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initSeatGrid();
    renderStudents();
    updateSeatGrid();
    setupDragAndDrop();
});

function loadData() {
    const savedData = localStorage.getItem('seatMapData');
    if (savedData) {
        const data = JSON.parse(savedData);
        students = data.students || [];
        settings = data.settings || settings;
        seatGrid = data.seatGrid || [];
    }

    if (seatGrid.length === 0) {
        for (let i = 0; i < settings.rows * settings.cols; i++) {
            seatGrid.push(null);
        }
    }

    document.getElementById('className').value = data.className || '2024级1班';
    document.getElementById('teacherName').value = settings.teacherName || '';
    document.getElementById('seatLabel').value = settings.seatLabel || 'both';
    document.getElementById('genderLabel').value = settings.genderLabel || 'color';
    document.getElementById('rowsInput').value = settings.rows || 6;
    document.getElementById('colsInput').value = settings.cols || 8;
}

function saveData() {
    const data = {
        students: students,
        settings: settings,
        seatGrid: seatGrid,
        className: document.getElementById('className').value
    };
    localStorage.setItem('seatMapData', JSON.stringify(data));
    showToast('数据已保存', 'success');
}

function initSeatGrid() {
    const totalSeats = settings.rows * settings.cols;
    if (seatGrid.length !== totalSeats) {
        seatGrid = new Array(totalSeats).fill(null);
    }
}

function renderStudents() {
    const studentList = document.getElementById('studentList');
    studentList.innerHTML = '';

    students.forEach((student, index) => {
        const div = document.createElement('div');
        div.className = `student-item ${student.gender}`;
        div.draggable = true;
        div.dataset.index = index;

        div.innerHTML = `
            <div class="student-info">
                <div class="student-number">${student.number}</div>
                <div class="student-name">${student.name}</div>
            </div>
            <button class="student-delete" onclick="deleteStudent(${index})">删除</button>
        `;

        div.addEventListener('dragstart', handleStudentDragStart);
        div.addEventListener('dragend', handleDragEnd);

        studentList.appendChild(div);
    });
}

function updateSeatGrid() {
    settings.rows = parseInt(document.getElementById('rowsInput').value) || 6;
    settings.cols = parseInt(document.getElementById('colsInput').value) || 8;

    initSeatGrid();
    renderSeats();
}

function renderSeats() {
    const container = document.getElementById('seatContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;

    seatGrid.forEach((student, index) => {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.dataset.index = index;
        seat.draggable = true;

        const row = Math.floor(index / settings.cols);
        const displayRow = settings.rows - row;
        const col = (index % settings.cols) + 1;
        const seatPosition = `${displayRow}行${col}列`;

        if (student === 'empty') {
            seat.classList.add('empty');
        } else if (student !== null) {
            seat.classList.add(student.gender);
            seat.setAttribute('title', `${seatPosition} - ${student.name}`);

            let label = '';
            if (settings.seatLabel === 'number') {
                label = student.number;
            } else if (settings.seatLabel === 'name') {
                label = student.name;
            } else {
                label = `<div class="seat-number">${student.number}</div>
                        <div class="seat-name">${student.name}</div>`;
            }

            seat.innerHTML = `
                ${settings.seatLabel === 'both' ? '' : label}
                <button class="seat-remove" onclick="removeFromSeat(${index})">×</button>
            `;

            if (settings.seatLabel === 'both') {
                const numberDiv = document.createElement('div');
                numberDiv.className = 'seat-number';
                numberDiv.textContent = student.number;
                seat.appendChild(numberDiv);

                const nameDiv = document.createElement('div');
                nameDiv.className = 'seat-name';
                nameDiv.textContent = student.name;
                seat.appendChild(nameDiv);

                seat.querySelector('.seat-remove').style.display = 'block';
            } else {
                const labelDiv = document.createElement('div');
                labelDiv.textContent = label;
                seat.appendChild(labelDiv);
                const removeBtn = document.createElement('button');
                removeBtn.className = 'seat-remove';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => removeFromSeat(index);
                seat.appendChild(removeBtn);
            }

            seat.addEventListener('dragstart', handleSeatDragStart);
            seat.addEventListener('dragend', handleDragEnd);
        } else {
            seat.setAttribute('title', seatPosition);
        }

        seat.addEventListener('dragover', handleDragOver);
        seat.addEventListener('dragleave', handleDragLeave);
        seat.addEventListener('drop', handleDrop);

        container.appendChild(seat);
    });
}

function setupDragAndDrop() {
    const studentItems = document.querySelectorAll('.student-item');
    studentItems.forEach(item => {
        item.addEventListener('dragstart', handleStudentDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleStudentDragStart(e) {
    draggedSeatIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleSeatDragStart(e) {
    draggedSeatIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedSeatIndex = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.remove('drag-over');

    if (draggedSeatIndex === null) {
        return;
    }

    if (draggedSeatIndex === targetIndex) {
        return;
    }

    const sourceContent = seatGrid[draggedSeatIndex];
    const targetContent = seatGrid[targetIndex];

    seatGrid[draggedSeatIndex] = targetContent;
    seatGrid[targetIndex] = sourceContent;

    renderSeats();
    showToast('座位已交换', 'success');
}

function removeFromSeat(seatIndex) {
    if (seatGrid[seatIndex] !== null && seatGrid[seatIndex] !== 'empty') {
        seatGrid[seatIndex] = null;
        renderSeats();
        showToast('已从座位移除', 'success');
    }
}

function addStudent() {
    document.getElementById('addStudentModal').classList.add('active');
}

function confirmAddStudent() {
    const number = document.getElementById('studentNumber').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const gender = document.getElementById('studentGender').value;

    if (!number || !name) {
        showToast('请填写完整信息', 'error');
        return;
    }

    if (students.some(s => s.number === number)) {
        showToast('学号已存在', 'error');
        return;
    }

    students.push({ number, name, gender });
    renderStudents();
    closeModal('addStudentModal');

    document.getElementById('studentNumber').value = '';
    document.getElementById('studentName').value = '';

    showToast(`已添加学生：${name}`, 'success');
}

function deleteStudent(index) {
    if (confirm(`确定要删除 ${students[index].name} 吗？`)) {
        students.splice(index, 1);

        for (let i = 0; i < seatGrid.length; i++) {
            if (seatGrid[i] !== null && seatGrid[i] !== 'empty') {
                const idx = students.findIndex(s => s.number === seatGrid[i].number);
                if (idx === -1) {
                    seatGrid[i] = null;
                }
            }
        }

        renderStudents();
        renderSeats();
        showToast('学生已删除', 'success');
    }
}

function importStudents() {
    document.getElementById('importModal').classList.add('active');
}

function confirmImport() {
    const text = document.getElementById('importText').value.trim();

    if (!text) {
        showToast('请输入学生信息', 'error');
        return;
    }

    const lines = text.split('\n');
    let count = 0;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        const parts = line.split(/\s+/);
        let number, name, gender = 'boy';

        if (parts.length >= 2) {
            number = parts[0];
            name = parts[1];
            if (parts.length >= 3) {
                gender = parts[2].includes('女') || parts[2].toLowerCase().includes('girl') ? 'girl' : 'boy';
            }
        }

        if (number && name && !students.some(s => s.number === number)) {
            students.push({ number, name, gender });
            count++;
        }
    });

    renderStudents();
    closeModal('importModal');
    document.getElementById('importText').value = '';

    showToast(`成功导入 ${count} 名学生`, 'success');
}

function clearAllStudents() {
    if (confirm('确定要清空所有学生吗？此操作不可恢复！')) {
        students = [];
        seatGrid = new Array(settings.rows * settings.cols).fill(null);
        renderStudents();
        renderSeats();
        showToast('已清空所有学生', 'success');
    }
}

function randomizeSeats() {
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);
    const unseatedStudents = students.filter(s => !seatGrid.some(seat => seat !== null && seat !== 'empty' && seat.number === s.number));

    if (availableSeats.length < unseatedStudents.length) {
        showToast('座位不足，请增加座位数量', 'warning');
        return;
    }

    const shuffled = unseatedStudents.sort(() => Math.random() - 0.5);

    shuffled.forEach((student, index) => {
        if (availableSeats[index] !== undefined) {
            seatGrid[availableSeats[index]] = student;
        }
    });

    renderSeats();
    showToast('已随机排座', 'success');
}

function sortByNumber() {
    const numbered = students.filter(s => /^\d+$/.test(s.number));
    const unnumbered = students.filter(s => !/^\d+$/.test(s.number));

    numbered.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const sorted = [...numbered, ...unnumbered];

    const unseatedStudents = sorted.filter(s => !seatGrid.some(seat => seat !== null && seat !== 'empty' && seat.number === s.number));
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);

    if (availableSeats.length < unseatedStudents.length) {
        showToast('座位不足，请增加座位数量', 'warning');
        return;
    }

    unseatedStudents.forEach((student, index) => {
        if (availableSeats[index] !== undefined) {
            seatGrid[availableSeats[index]] = student;
        }
    });

    renderSeats();
    showToast('已按学号排序', 'success');
}

function sortByName() {
    const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'zh'));

    const unseatedStudents = sorted.filter(s => !seatGrid.some(seat => seat !== null && seat !== 'empty' && seat.number === s.number));
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);

    if (availableSeats.length < unseatedStudents.length) {
        showToast('座位不足，请增加座位数量', 'warning');
        return;
    }

    unseatedStudents.forEach((student, index) => {
        if (availableSeats[index] !== undefined) {
            seatGrid[availableSeats[index]] = student;
        }
    });

    renderSeats();
    showToast('已按姓名排序', 'success');
}

function resetGrid() {
    seatGrid = new Array(settings.rows * settings.cols).fill(null);
    renderSeats();
    showToast('座位网格已重置', 'success');
}

function markEmpty() {
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);
    if (availableSeats.length === 0) {
        showToast('没有可用座位', 'warning');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableSeats.length);
    seatGrid[availableSeats[randomIndex]] = 'empty';
    renderSeats();
    showToast('已标记一个空座', 'success');
}

function clearEmpty() {
    seatGrid = seatGrid.map(seat => seat === 'empty' ? null : seat);
    renderSeats();
    showToast('已清除空座标记', 'success');
}

function groupRandomize() {
    const groupCount = parseInt(document.getElementById('groupCount').value) || 4;
    const totalSeats = settings.rows * settings.cols;

    if (groupCount > totalSeats) {
        showToast('分组数量不能超过总座位数', 'error');
        return;
    }

    const availableStudents = students.filter(s => !seatGrid.some(seat => seat !== null && seat !== 'empty' && seat.number === s.number));
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);

    if (availableSeats.length < availableStudents.length) {
        showToast('座位不足，请增加座位数量', 'warning');
        return;
    }

    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    const groupSize = Math.ceil(shuffled.length / groupCount);

    for (let g = 0; g < groupCount; g++) {
        const startIdx = g * groupSize;
        const endIdx = Math.min(startIdx + groupSize, shuffled.length);

        for (let i = startIdx; i < endIdx; i++) {
            const seatIdx = availableSeats[i];
            if (seatIdx !== undefined) {
                seatGrid[seatIdx] = shuffled[i];
            }
        }
    }

    renderSeats();
    showToast(`已随机分成 ${groupCount} 组`, 'success');
}

function assignGroups() {
    const groupCount = parseInt(document.getElementById('groupCount').value) || 4;
    const totalSeats = settings.rows * settings.cols;

    if (groupCount > totalSeats) {
        showToast('分组数量不能超过总座位数', 'error');
        return;
    }

    const numbered = students.filter(s => /^\d+$/.test(s.number));
    const unnumbered = students.filter(s => !/^\d+$/.test(s.number));
    numbered.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const sorted = [...numbered, ...unnumbered];

    const availableStudents = sorted.filter(s => !seatGrid.some(seat => seat !== null && seat !== 'empty' && seat.number === s.number));
    const availableSeats = seatGrid.map((s, i) => s === null ? i : -1).filter(i => i !== -1);

    if (availableSeats.length < availableStudents.length) {
        showToast('座位不足，请增加座位数量', 'warning');
        return;
    }

    const groupSize = Math.ceil(availableStudents.length / groupCount);

    for (let g = 0; g < groupCount; g++) {
        const startIdx = g * groupSize;
        const endIdx = Math.min(startIdx + groupSize, availableStudents.length);

        for (let i = startIdx; i < endIdx; i++) {
            const seatIdx = availableSeats[i];
            if (seatIdx !== undefined) {
                seatGrid[seatIdx] = availableStudents[i];
            }
        }
    }

    renderSeats();
    showToast(`已按顺序分成 ${groupCount} 组`, 'success');
}

function showSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

function saveSettings() {
    settings.teacherName = document.getElementById('teacherName').value.trim();
    settings.seatLabel = document.getElementById('seatLabel').value;
    settings.genderLabel = document.getElementById('genderLabel').value;

    closeModal('settingsModal');
    renderSeats();
    showToast('设置已保存', 'success');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function printSeatMap() {
    window.print();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
