// 全局数据
let homeworks = [];
let subjects = [];
let currentFilter = 'all';
let searchText = '';
let selectedColor = '#4caf50';

// 默认科目数据
const defaultSubjects = [
  { id: '1', name: '语文', color: '#4caf50', category: '主科' },
  { id: '2', name: '数学', color: '#2196f3', category: '主科' },
  { id: '3', name: '英语', color: '#ff9800', category: '主科' },
  { id: '4', name: '生物', color: '#8bc34a', category: '副科' },
  { id: '5', name: '道法', color: '#e91e63', category: '副科' },
  { id: '6', name: '地理', color: '#00bcd4', category: '副科' },
  { id: '7', name: '历史', color: '#795548', category: '副科' },
  { id: '8', name: '物理', color: '#9c27b0', category: '副科' },
  { id: '9', name: '化学', color: '#ff5722', category: '副科' },
  { id: '10', name: '体育', color: '#607d8b', category: '副科' }
];

// 初始化数据
function initData() {
  // 初始化科目数据
  let existingSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  const subjectMap = {};
  
  existingSubjects.forEach(subject => {
    subjectMap[subject.id] = subject;
  });
  
  defaultSubjects.forEach(subject => {
    if (!subjectMap[subject.id]) {
      subjectMap[subject.id] = subject;
    }
  });
  
  subjects = Object.values(subjectMap);
  localStorage.setItem('subjects', JSON.stringify(subjects));
  
  // 初始化作业数据
  homeworks = JSON.parse(localStorage.getItem('homeworks') || '[]');
  
  updateStats();
  renderHomeworkList();
  renderSubjectList();
  renderSubjectOptions();
}

// 页面导航
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.getElementById(`page-${pageId}`).classList.add('active');
  
  const navItem = Array.from(document.querySelectorAll('.nav-item')).find(item => 
    item.getAttribute('onclick').includes(pageId)
  );
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // 更新统计数据
  if (pageId === 'main' || pageId === 'home') {
    updateStats();
  }
  
  if (pageId === 'home') {
    renderHomeworkList();
  }
  
  if (pageId === 'subject') {
    renderSubjectList();
  }
}

// 更新统计数据
function updateStats() {
  const total = homeworks.length;
  const pending = homeworks.filter(h => h.status === 'pending').length;
  const dueToday = homeworks.filter(h => isDueToday(h.dueDate)).length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-due').textContent = dueToday;
  
  // 更新状态分布
  const completed = homeworks.filter(h => h.status === 'completed').length;
  const processing = homeworks.filter(h => h.status === 'processing').length;
  
  const totalStatus = pending + processing + completed;
  const pendingPercent = totalStatus > 0 ? (pending / totalStatus) * 100 : 0;
  const processingPercent = totalStatus > 0 ? (processing / totalStatus) * 100 : 0;
  const completedPercent = totalStatus > 0 ? (completed / totalStatus) * 100 : 0;
  
  document.getElementById('status-pending-count').textContent = pending;
  document.getElementById('status-processing-count').textContent = processing;
  document.getElementById('status-completed-count').textContent = completed;
  
  document.getElementById('bar-pending').style.width = pendingPercent + '%';
  document.getElementById('bar-processing').style.width = processingPercent + '%';
  document.getElementById('bar-completed').style.width = completedPercent + '%';
  
  renderPieChart();
  renderTrendChart();
}

// 判断是否今天到期
function isDueToday(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// 渲染作业列表
function renderHomeworkList() {
  const container = document.getElementById('homework-container');
  let filtered = [...homeworks];
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(h => h.status === currentFilter);
  }
  
  if (searchText) {
    const lower = searchText.toLowerCase();
    filtered = filtered.filter(h => 
      h.title.toLowerCase().includes(lower) ||
      (h.description && h.description.toLowerCase().includes(lower)) ||
      getSubjectName(h.subjectId).toLowerCase().includes(lower)
    );
  }
  
  filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">暂无作业</p>';
    return;
  }
  
  container.innerHTML = filtered.map(homework => `
    <div class="homework-item" onclick="showHomeworkDetail('${homework.id}')">
      <div class="homework-title">${homework.title}</div>
      <div class="homework-info">
        <span class="homework-subject" style="background-color: ${getSubjectColor(homework.subjectId)}20; color: ${getSubjectColor(homework.subjectId)}">${getSubjectName(homework.subjectId)}</span>
        <span class="status-tag status-${homework.status}">${getStatusText(homework.status)}</span>
        <span>${formatDate(homework.dueDate)}</span>
      </div>
    </div>
  `).join('');
}

// 获取科目名称
function getSubjectName(subjectId) {
  const subject = subjects.find(s => s.id === subjectId);
  return subject ? subject.name : '未分类';
}

// 获取科目颜色
function getSubjectColor(subjectId) {
  const subject = subjects.find(s => s.id === subjectId);
  return subject ? subject.color : '#999999';
}

// 获取状态文本
function getStatusText(status) {
  const map = {
    pending: '未开始',
    processing: '进行中',
    completed: '已完成'
  };
  return map[status] || '未知';
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未设置';
  
  const date = new Date(dateStr);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return '今天';
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  }
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 设置筛选
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderHomeworkList();
}

// 搜索作业
function filterHomeworks() {
  searchText = document.getElementById('search-input').value;
  renderHomeworkList();
}

// 添加作业
function submitHomework(event) {
  event.preventDefault();
  
  const homework = {
    id: Date.now().toString(),
    title: document.getElementById('hw-title').value,
    description: document.getElementById('hw-desc').value,
    subjectId: document.getElementById('hw-subject').value,
    dueDate: document.getElementById('hw-due-date').value,
    priority: document.getElementById('hw-priority').value,
    status: 'pending',
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString()
  };
  
  homeworks.push(homework);
  localStorage.setItem('homeworks', JSON.stringify(homeworks));
  
  alert('作业添加成功');
  navigateTo('home');
  
  // 清空表单
  document.getElementById('homework-form').reset();
}

// 显示作业详情
function showHomeworkDetail(id) {
  const homework = homeworks.find(h => h.id === id);
  if (!homework) return;
  
  const content = document.getElementById('homework-detail-content');
  content.innerHTML = `
    <div class="detail-title">${homework.title}</div>
    <div class="detail-info">
      <span class="detail-subject" style="background-color: ${getSubjectColor(homework.subjectId)}20; color: ${getSubjectColor(homework.subjectId)}">${getSubjectName(homework.subjectId)}</span>
      <span class="detail-status status-${homework.status}">${getStatusText(homework.status)}</span>
    </div>
    <div class="detail-desc">${homework.description || '暂无描述'}</div>
    <div>截止日期: ${homework.dueDate}</div>
    <div>优先级: ${homework.priority === 'high' ? '高' : homework.priority === 'medium' ? '中' : '低'}</div>
    <div class="detail-actions">
      <button onclick="deleteHomework('${id}')">删除</button>
      <button onclick="toggleHomeworkStatus('${id}')">${homework.status === 'completed' ? '标记未完成' : '标记完成'}</button>
    </div>
  `;
  
  navigateTo('detail');
}

// 删除作业
function deleteHomework(id) {
  if (confirm('确定要删除这个作业吗？')) {
    homeworks = homeworks.filter(h => h.id !== id);
    localStorage.setItem('homeworks', JSON.stringify(homeworks));
    alert('作业已删除');
    navigateTo('home');
  }
}

// 切换作业状态
function toggleHomeworkStatus(id) {
  const homework = homeworks.find(h => h.id === id);
  if (homework) {
    homework.status = homework.status === 'completed' ? 'pending' : 'completed';
    homework.updateTime = new Date().toLocaleString();
    localStorage.setItem('homeworks', JSON.stringify(homeworks));
    alert('状态已更新');
    showHomeworkDetail(id);
    updateStats();
  }
}

// 渲染科目列表
function renderSubjectList() {
  const container = document.getElementById('subject-list');
  
  if (subjects.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">暂无科目</p>';
    return;
  }
  
  container.innerHTML = subjects.map(subject => `
    <div class="subject-card">
      <div class="subject-color" style="background-color: ${subject.color}"></div>
      <div class="subject-name">${subject.name}</div>
      <div class="subject-actions">
        <button onclick="editSubject('${subject.id}')">✏️</button>
        <button onclick="deleteSubject('${subject.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// 渲染科目选择选项
function renderSubjectOptions() {
  const select = document.getElementById('hw-subject');
  select.innerHTML = '<option value="">请选择科目</option>' + 
    subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

// 添加/编辑科目弹窗
let isEditSubject = false;
let editSubjectId = null;

function showAddSubjectModal() {
  isEditSubject = false;
  editSubjectId = null;
  document.getElementById('subject-name').value = '';
  document.getElementById('subject-color').value = '#4caf50';
  selectedColor = '#4caf50';
  document.querySelector('.modal-content h3').textContent = '添加科目';
  document.getElementById('subject-modal').classList.add('active');
}

function editSubject(id) {
  const subject = subjects.find(s => s.id === id);
  if (!subject) return;
  
  isEditSubject = true;
  editSubjectId = id;
  document.getElementById('subject-name').value = subject.name;
  document.getElementById('subject-color').value = subject.color;
  selectedColor = subject.color;
  document.querySelector('.modal-content h3').textContent = '编辑科目';
  document.getElementById('subject-modal').classList.add('active');
}

function closeSubjectModal() {
  document.getElementById('subject-modal').classList.remove('active');
}

function selectColor(color) {
  selectedColor = color;
  document.getElementById('subject-color').value = color;
}

function saveSubject() {
  const name = document.getElementById('subject-name').value.trim();
  if (!name) {
    alert('科目名称不能为空');
    return;
  }
  
  if (isEditSubject && editSubjectId) {
    const subject = subjects.find(s => s.id === editSubjectId);
    if (subject) {
      subject.name = name;
      subject.color = selectedColor;
    }
  } else {
    subjects.push({
      id: Date.now().toString(),
      name: name,
      color: selectedColor,
      category: '副科'
    });
  }
  
  localStorage.setItem('subjects', JSON.stringify(subjects));
  closeSubjectModal();
  renderSubjectList();
  renderSubjectOptions();
  alert(isEditSubject ? '科目编辑成功' : '科目添加成功');
}

function deleteSubject(id) {
  if (confirm('确定要删除这个科目吗？')) {
    subjects = subjects.filter(s => s.id !== id);
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjectList();
    renderSubjectOptions();
    alert('科目已删除');
  }
}

// 渲染饼图
function renderPieChart() {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 200);
  
  const pending = homeworks.filter(h => h.status === 'pending').length;
  const processing = homeworks.filter(h => h.status === 'processing').length;
  const completed = homeworks.filter(h => h.status === 'completed').length;
  
  const total = pending + processing + completed;
  if (total === 0) {
    ctx.fillText('暂无数据', 70, 100);
    return;
  }
  
  const colors = ['#ffc107', '#17a2b8', '#28a745'];
  const data = [pending, processing, completed];
  
  let startAngle = 0;
  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  
  data.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();
    startAngle += sliceAngle;
  });
}

// 渲染趋势图
function renderTrendChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 300, 150);
  
  const trendStats = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = homeworks.filter(h => h.dueDate === dateStr).length;
    trendStats.push({ date: dateStr, count: count });
  }
  
  const maxCount = Math.max(...trendStats.map(item => item.count), 1);
  const barWidth = 30;
  const gap = 15;
  const startX = 20;
  const startY = 130;
  
  trendStats.forEach((item, index) => {
    const height = (item.count / maxCount) * 100;
    const x = startX + index * (barWidth + gap);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x, startY - height, barWidth, height);
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText(item.date.substring(5), x, 145);
  });
}

// 清除缓存
function clearCache() {
  if (confirm('确定要清除所有缓存吗？')) {
    localStorage.clear();
    initData();
    alert('缓存已清除');
  }
}

// 主题颜色选择
function showThemeColors() {
  const colors = [
    { name: '默认绿色', color: '#4caf50' },
    { name: '蓝色', color: '#2196f3' },
    { name: '橙色', color: '#ff9800' },
    { name: '紫色', color: '#9c27b0' },
    { name: '红色', color: '#f44336' },
    { name: '青色', color: '#00bcd4' }
  ];
  
  let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">';
  colors.forEach(c => {
    html += `<button onclick="setThemeColor('${c.color}')" style="padding: 15px; background-color: ${c.color}; color: white; border: none; border-radius: 8px;">${c.name}</button>`;
  });
  html += '</div>';
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>选择主题颜色</h3>
      ${html}
      <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 15px; padding: 12px; background-color: #f5f5f5; border: none; border-radius: 8px;">取消</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function setThemeColor(color) {
  document.querySelector('.header').style.backgroundColor = color;
  document.querySelector('.submit-btn').style.backgroundColor = color;
  document.querySelector('.add-btn').style.backgroundColor = color;
  document.querySelector('.action-btn').style.backgroundColor = color;
  document.querySelector('.detail-actions button:last-child').style.backgroundColor = color;
  document.querySelector('.modal-buttons button:last-child').style.backgroundColor = color;
  document.querySelectorAll('.filter-btn.active').forEach(btn => btn.style.backgroundColor = color);
  document.querySelectorAll('.brush-option.active').forEach(btn => btn.style.backgroundColor = color);
  document.querySelectorAll('.nav-item.active').forEach(item => item.style.color = color);
  
  document.querySelectorAll('.stat-value').forEach(el => el.style.color = color);
  
  localStorage.setItem('themeColor', color);
  document.querySelector('.modal.active').remove();
  alert('主题颜色已更新');
}

// 关于我们
function showAbout() {
  alert('牛福克拉斯的作业统计助手 v1.0.0\n\n一款专为学生设计的作业管理工具，帮助你更好地管理学习任务。');
}

// 电子白板功能
let isDrawing = false;
let ctx = null;
let lineWidth = 5;
let lineColor = '#000000';
let isEraser = false;
let brushType = 'round';

function initWhiteboard() {
  const canvas = document.getElementById('whiteboard');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', drawing);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);
  
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY, rect: rect });
  });
  
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    drawing({ clientX: touch.clientX, clientY: touch.clientY });
  });
  
  canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
  isDrawing = true;
  ctx.beginPath();
  
  const rect = document.getElementById('whiteboard').getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.moveTo(x, y);
  
  if (isEraser) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = lineWidth * 3;
  } else {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = brushType;
    ctx.lineJoin = brushType;
  }
}

function drawing(e) {
  if (!isDrawing) return;
  
  const rect = document.getElementById('whiteboard').getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function stopDrawing() {
  isDrawing = false;
}

function changeLineWidth(e) {
  lineWidth = e.target.value;
  document.getElementById('line-width-value').textContent = lineWidth;
}

function changeColor(e) {
  lineColor = e.target.value;
  document.getElementById('hex-value').value = e.target.value;
}

function changeColorByHex(e) {
  const hex = e.target.value;
  if (/^#([0-9A-Fa-f]{6})$/.test(hex)) {
    lineColor = hex;
    document.getElementById('line-color').value = hex;
  }
}

function changeBrushType(type) {
  brushType = type;
  document.querySelectorAll('.brush-option').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function toggleEraser() {
  isEraser = !isEraser;
  const btn = document.querySelector('.action-btn:last-child');
  btn.innerHTML = isEraser ? '✏️ 画笔' : '🧽 橡皮';
}

function clearCanvas() {
  if (confirm('确定要清除画布吗？')) {
    ctx.clearRect(0, 0, 375, 500);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initData();
  initWhiteboard();
  
  // 加载保存的主题颜色
  const savedColor = localStorage.getItem('themeColor');
  if (savedColor) {
    setThemeColor(savedColor);
  }
});