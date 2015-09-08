document.addEventListener("touchstart", function() {}, true);

Messenger.options = {
  extraClasses: 'messenger-on-top',
  parentLocations: ['.main'],
  theme: 'block'
};
var duration = 10000000000000;

var triggerEl = '#button';

$(document).ready(function() {
  $('.message-capture').fadeOut('400');
});


$(document).on('tap', triggerEl, function(e) {
  var $this = $(this);
  $this.addClass('active');
  $this.toggleClass('record');

  if ($this.hasClass('record')) {
    socket.emit('start', 'go');
    console.log('emit start');
    $(triggerEl).addClass('wait');
    setTimeout(function(){
      $(triggerEl).removeClass('record');
    }, 250);
  }
});

socket = io(':' + config.server.port)
  .on('connect', function() {
    console.log('connected');
    Messenger().post({
      message: '<span>Connected',
      type: 'success',
      id: 'info',
      hideAfter: duration
    });
    init();
  })
  .on('disconnect', function() {
    console.log('We\'ve been disconnected');
    Messenger().post({
      message: '<span>Disconnected</span>',
      type: 'error',
      id: 'info',
      hideAfter: duration
    });
    freez();
  })
  .on('error', function() {
    console.log('error while connecting');
  })
  .on('reconnect', function(nbtry) {
    Messenger().post({
      message: '<span>Successfull reconnection.</span>',
      type: 'info',
      id: 'info',
      hideAfter: duration
    });
    init();
    console.log('Successfull reconnect after ' + nbtry + ' trying.');
  })
  .on('reconnecting', function(nbtry) {
    console.log('Trying to reconnect.');
    Messenger().post({
      message: '<span>Attempting to reconnect...</span></span><span class="loader">Reconnect</span>',
      type: 'warning',
      id: 'info',
      hideAfter: duration
    });
  })
  .on('time', function(data) {
    console.log(data);
    var percent = 100 - (data.time / data.duration) * 100;
    $('.bar').css({
      width: percent + '%'
    });
    $('.pack span').text(moment.utc(data.time).format("HH:mm:ss"));
  })
  .on('stop', function(data) {
    console.log('finished: ', data);
    $('#label').text('Capture photo').addClass('wait');
    $(triggerEl).removeClass('record').addClass('wait');
  })
  .on('error', function(data) {
    console.log(data);
    $('message').addClass('error').text(data.msg);
  })
  .on('success', function(data) {
    $('message').addClass('success').text(data.msg);
    setTimeout(clearMessage, 3000);
  })
  .on('photoTaken', function(){
    $(triggerEl).removeClass('active');
    $(triggerEl).removeClass('wait');
    $('.message-capture').fadeIn(400, function() {
      setTimeout(function(){
        $('.message-capture').fadeOut('400');
      }, 1500);
    });
  });

var clearMessage = function() {
  $('message').empty().removeClass('error success');
  $('.wait').removeClass('wait');
}

var init = function() {
  $('.bar').css({
    width: 0 + '%'
  });
  $('.pack span').text('00:00:00');
  $('.wait').removeClass('wait');
  if(config.remote){
    $('.pack').hide();
  }
}

var freez = function() {
  $('.bar').css({
    width: 0 + '%'
  });
  // $('.pack span').text('00:00:00');
  $('#label').text('Capture photo').addClass('wait');
  $(triggerEl).removeClass('record').addClass('wait');
}

var loading = function(){
  $('#label').text('Capture photo').addClass('wait');
  $(triggerEl).addClass('wait');
}