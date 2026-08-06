// ══════════════════════════════════════
// MYSELF APP — SERVICE WORKER
// ══════════════════════════════════════

const CACHE_NAME = 'myself-v1';

// Instalar Service Worker
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

// Receber mensagem do app para agendar notificação
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFS') {
    var alarms = e.data.alarms || {};
    var data   = e.data.data   || {};
    checkAndNotify(alarms, data);
  }
});

// Verificar alarmes e enviar notificação
function checkAndNotify(alarms, data) {
  var now      = new Date();
  var timeStr  = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
  var dayMap   = {0:'Dom',1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sab'};
  var todayStr = now.toLocaleDateString('pt');
  var todayName= dayMap[now.getDay()];
  var fn       = data.name ? data.name.split(' ')[0] : 'Myself';

  // ── TAREFAS ──
  if (alarms.tasks && timeStr === alarms.tasks) {
    var pend = (data.tasks || []).filter(function(t){ return !t.done; }).length;
    if (pend > 0) {
      self.registration.showNotification('✅ Tarefas — ' + fn, {
        body: pend + ' tarefa' + (pend !== 1 ? 's' : '') + ' pendente' + (pend !== 1 ? 's' : '') + ' hoje!',
        icon: './icon.jpg',
        badge: './icon.jpg',
        vibrate: [200, 100, 200],
        tag: 'tasks'
      });
    }
  }

  // ── AULAS (avisa dia anterior às 20:00) ──
  if (timeStr === '20:00') {
    var tomorrow     = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    var tomorrowName = dayMap[tomorrow.getDay()];
    var aulasAmanha  = (data.discs || []).filter(function(d){
      return d.days && d.days.indexOf(tomorrowName) >= 0;
    });
    if (aulasAmanha.length > 0) {
      var nomes = aulasAmanha.map(function(d){
        return d.name + (d.hora ? ' • ' + d.hora : '');
      }).join('\n');
      self.registration.showNotification('🎓 Aulas amanhã — ' + fn, {
        body: aulasAmanha.length + ' aula' + (aulasAmanha.length !== 1 ? 's' : '') + ' amanhã:\n' + nomes,
        icon: './icon.jpg',
        badge: './icon.jpg',
        vibrate: [200, 100, 200],
        tag: 'classes'
      });
    }
  }

  // ── FINANCEIRO ──
  if (alarms.finance && timeStr === alarms.finance) {
    var inc = 0, exp = 0;
    (data.txs || []).forEach(function(t) {
      if (t.date === todayStr) {
        if (t.type === 'in') inc += t.val; else exp += t.val;
      }
    });
    self.registration.showNotification('💰 Resumo financeiro — ' + fn, {
      body: 'Hoje: +' + inc.toFixed(0) + ' MT ganhos | -' + exp.toFixed(0) + ' MT gastos',
      icon: './icon.jpg',
      badge: './icon.jpg',
      vibrate: [200, 100, 200],
      tag: 'finance'
    });
  }

  // ── HÁBITOS ──
  if (alarms.habits && timeStr === alarms.habits) {
    var habs    = data.habits || [];
    var habOn   = habs.filter(function(hb){ return hb.on; }).length;
    if (habs.length > 0) {
      self.registration.showNotification('🔥 Hábitos — ' + fn, {
        body: habOn + '/' + habs.length + ' hábitos feitos. Não quebres o streak!',
        icon: './icon.jpg',
        badge: './icon.jpg',
        vibrate: [200, 100, 200],
        tag: 'habits'
      });
    }
  }
}

// Clicar na notificação abre o app
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
