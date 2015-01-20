document.addEventListener("touchstart", function() {}, true);

Messenger.options = {
  extraClasses: 'messenger-on-top',
  parentLocations: ['.main'],
  theme: 'block'
};
//little hack
var duration = 10000000000000;

$(function() {
  FastClick.attach(document.body);
  $(document).on('click', '#button', function(e) {
    var $this = $(this);
    if (!$this.hasClass('wait')) {
      $this.addClass('active');
      setTimeout(function() {
        $this.removeClass('active');
        $this.toggleClass('record');
        if ($this.hasClass('record')) {
          $('#label').text('Stop');
          socket.emit('start', 'go');
        } else {
          $('#label').text('Record');
          socket.emit('stop', 'go');
        }
      }, 250);
    }
  });

});

socket = io(':3002');

socket
  .on('connect', function() {
    console.log('connected');
    Messenger().post({
      message: '<span>Your device is connected to the internet.',
      type: 'success',
      id: 'info',
      hideAfter: duration
    });
    init();
  })
  .on('disconnect', function() {
    console.log('We\'ve been disconnected');
    Messenger().post({
      message: '<span>Your device losts its internet connection.</span>',
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
    //console.log(data);
    var percent = 100 - (data.time / data.duration) * 100;
    $('.bar').css({
      width: percent + '%'
    });
    $('.pack span').text(moment.utc(data.time).format("HH:mm:ss"));
  })
  .on('stop', function(data) {
    console.log('finished: ', data);
    $('#label').text('Record').addClass('wait');
    $('#button').removeClass('record').addClass('wait');
    $('message').addClass('success').text(data.msg);
  })
  .on('error', function(data) {
    console.log(data);
    $('message').addClass('error').text(data.msg);
  })
  .on('success', function(data) {
    $('message').addClass('success').text(data.msg);
    setTimeout(function(){
      $('message').addClass('success').text('Video saved !');
    }, 1000);
    setTimeout(clearMessage, 3000);
  })
  .on('message', function(data){
    $('message').text(data.msg);
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
}

var freez = function() {
  $('.bar').css({
    width: 0 + '%'
  });
  $('.pack span').text('00:00:00');
  $('#label').text('Record').addClass('wait');
  $('#button').removeClass('record').addClass('wait');
}