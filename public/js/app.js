// Global state variable(s)
var state = {
   user : null,
   token : null
}
var dataDefaults;

/********************************** DOM FUNCTIONS ****************************************/
$(document).ready(function() {
  $.ajax({
    url : '/wordgame/api/v3/user',
    method : 'GET',
    success : (user, status, request) =>{
      state.user = user;
      state.token =  request.getResponseHeader('token');
      var username = user.name.first;
      if(user.role === "USER") {
        $(".username").text("");
        $(".username").text("Hello " + username + "!");
        getGames(user.id);
        getMetadata();
        $('body').css('background-image', 'url("/images/lettersBackground.jpg")');
        $('#login').hide();
        $('#home').show();
      } else if (user.role === "ADMIN"){
        $(".username").text("");
        $(".username").text("Hello " + username + "!");
        getUsers();
        $('body').css('background-image', 'url("/images/admin.png")');
        $('#login').hide();
        $('#userList').show();
      }
    },
    error : () => {
      $('body').css('background-image', 'url("/images/letterRain.gif")');
      $('#login').show();
      $('#gameView').hide();
      $('#home').hide();
      state.user = null;
    }
  });
});

function login(evt) {
  evt.preventDefault();

  var username = $('#login_username').val();
  var password = $('#login_password').val();

  $('#login_username').val('');
  $('#login_password').val('');

  var mailRegex = /^([a-zA-Z0-9]+(([._-]?[a-zA-Z0-9]+)?)+)+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/igm;
  var passRegex = /^(?=.*\d)[A-Za-z\d]{3,}$/g;

  if(!mailRegex.test(username) || !passRegex.test(password)) {
    alert("Invalid username or password!");
    return;
  }

  getLogin(username, password);
};

function makeMetadata(metadata) {
  dataDefaults = metadata;
  clearOptions();
  metadata.levels.forEach(level => {
    $('#levelField').append('<option class= ' + level.name + '>' + level.name + '</option>');
  });
  metadata.font.forEach(font => {
    $('head').append('<link rel="stylesheet" href="' + font.url + '" class="fontLink">');
    $('#fontField').append('<option class= ' + font.name + '>' + font.name + '</option>');
  });

  if(state.user.defaults) {
    $('#wordColor').val(state.user.defaults.colors.wordBackground);
    $('#guessColor').val(state.user.defaults.colors.guessBackground);
    $('#foreColor').val(state.user.defaults.colors.textBackground);
    $('.' + state.user.defaults.font.name).attr('selected', 'selected');
    $("#fontField").attr('style', 'font-family:' + state.user.defaults.font.rule);
    $('.' + state.user.defaults.level.name).attr('selected', 'selected');
  } else {
    $('#wordColor').val(metadata.defaults.colors.wordBackground);
    $('#guessColor').val(metadata.defaults.colors.guessBackground);
    $('#foreColor').val(metadata.defaults.colors.textBackground);
    $('.' + metadata.defaults.font.name).attr('selected', 'selected');
    $("#fontField").attr('style', 'font-family:' + metadata.defaults.font.rule);
    $('.' + metadata.defaults.level.name).attr('selected', 'selected');
  }
};

function updateFont(fonts) {
  var fontName = $('#fontField').val();
  fonts.forEach(font => {
    if (font.name === fontName) {
      $("#fontField").attr('style', 'font-family:' + font.rule);
      return;
    }
  });
};

function saveSettings () {
  var colors = {
    'guessBackground': $('#guessColor').val(),
    'textBackground': $('#foreColor').val(),
    'wordBackground': $('#wordColor').val()
  }
  var selectedLevel = $('#levelField').val();
  var selectedFont = $('#fontField').val();
  var newDefaults = {};

  dataDefaults.font.forEach(f => {
    if (f.name === selectedFont) {
      newDefaults.font = f;
      return;
    }
  });

  dataDefaults.levels.forEach(l => {
    if (l.name === selectedLevel) {
      newDefaults.level = l;
      return;
    }
  });

  newDefaults.colors = colors;
  state.user.defaults = newDefaults;
  updateDefaults(newDefaults);
};

function newGame() {
  var colors = {
    'guessBackground': $('#guessColor').val(),
    'textBackground': $('#foreColor').val(),
    'wordBackground': $('#wordColor').val()
  }
  var level = $('#levelField').val();
  var font = $('#fontField').val();
  createGame(font, level, colors);
};

function buildGame(result) {
  var game;
  if(Array.isArray(result)) {
    game = result[0];
  } else {
    game = result;
  }

  clearGame();
  $("#remaining").prepend(game.remaining + ' guesses remaining.');

  for (var i = 0; i < game.guesses.length; i++) {
    $('#guesses').append('<div class="guess" style="font-family:' + game.font.rule + '; color:' + game.colors.textBackground + '; background-color:' + game.colors.guessBackground + '">' + game.guesses[i] + '</div>');
  }

  for (var i = 0; i < game.view.length; i++) {
    $('#guess').append('<div class="guessWord" style="font-family:' + game.font.rule + '; color:' + game.colors.textBackground + '; background-color:' + game.colors.wordBackground + '">' + game.view[i] + '</div>');
  }

  if (game.status === 'victory') {
    $('#gameView').css('background-image', 'url(' + getBackground(1) + ')');
    $('#remaining').css('visibility', 'hidden');
    $('#textField').css('visibility', 'hidden');
    $('#guess-btn').css('visibility', 'hidden');
  }

  if (game.status === 'loss') {
    $('#gameView').css('background-image', 'url(' + getBackground(0) + ')');
    $('#remaining').css('visibility', 'hidden');
    $('#textField').css('visibility', 'hidden');
    $('#guess-btn').css('visibility', 'hidden');
  }

  $('#guess-btn').unbind('click').click(function() {
    if ($('#textField').val() === "") {
      alert('Invalid, enter a character.');
      return;
    }
    makeGuess(state.user.id, game._id, $('#textField').val()[0].toLowerCase());
    $('#textField').val('');
  });

  $('#textField').unbind('keypress').keypress(function(event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
      event.preventDefault();
      if ($('#textField').val() === "") {
        alert('Invalid, enter a character.');
        return;
      }
      makeGuess(state.user.id, game._id, $('#textField').val()[0].toLowerCase());
      $('#textField').val('');
    }
  });

  $("#close").unbind('click').click(function() {
    getGames(state.user.id);
    closeGame();
  });
  showModal();
};

function getBackground(num) {
  var random = Math.floor(Math.random() * 3) + 1;
  if (num === 0) {
    if (random === 1) {
      return '/images/cry.gif';
    }
    if (random === 2) {
      return '/images/explosion.gif';
    }
    if (random === 3) {
      return '/images/unhappy.gif';
    }
  }
  if (num === 1) {
    if (random === 1) {
      return '/images/winner.gif';
    }
    if (random === 2) {
      return '/images/gear.gif';
    }
    if (random === 3) {
      return '/images/happy.gif';
    }
  }
}

function clearOptions() {
  $('#fontField').empty();
  $('#levelField').empty();
  $('link.fontLink').remove();
};

function clearGame() {
  $('#gameView').css('background-image', 'none');
  $('#remaining').css('visibility', 'visible');
  $('#textField').css('visibility', 'visible');
  $('#guess-btn').css('visibility', 'visible');
  $('#remaining').empty();
  $('#guesses').empty();
  $('#guess').empty();
};

function showModal() {
  $('#gameView').slideDown();
  $('#home').slideUp();
};

function closeGame() {
  $('#gameView').slideUp();
  $('#home').slideDown();
};

function divString(string, font, colors) {
  var divStr = "";
  for (var i = 0; i < string.length; i++) {
    divStr = divStr + '<div class="phraseDiv" style="font-family: ' + font.rule + '; color: ' + colors.textBackground + '; background-color: ' + colors.wordBackground + '">' + string[i] + '</div>';
  }
  return divStr;
};

function buildTable(games) {
  $('#tableHead').nextAll().remove();
  var i = 0;

  games.forEach(game => {
    var level = '<td class="level">' + game.level.name + '</td>';
    var phrase = '<td class="phrase">' + divString(game.view, game.font, game.colors) + '</td>';
    var remainder = '<td class="remainder">' + game.remaining + '</td>';
    var answer;
    if (game.target) {
      answer = '<td class="answer">' + game.target + '</td>';
    } else {
      answer = '<td class="answer"></td>';
    }
    var status = '<td class="status">' + game.status + '</td>';
    $('#tableBody').append('<tr id="' + i + '" class="rows">' + level + phrase + remainder + answer + status + '</tr>');
    $('tr#' + i).addClass('clickable');
    $('tr#' + i).unbind('click').click(function() {
      getGame(game.userId, game._id);
    });
    i += 1;
  });
};

function buildUsersTable(users) {
  $('#userListHead').nextAll().remove();
  var i = 0;

  users.forEach(user => {
    var first = '<td class="list first">' + user.name.first + '</td>';
    var last = '<td class="list last">' + user.name.last + '</td>';
    var email = '<td class="list email">' + user.email + '</td>';
    var role = '<td class="list role">' + user.role + '</td>';
    var status;
    if(user.enabled === "true") {
      status = '<td class="list status">' + 'enabled' + '</td>';
      $('#userListBody').append('<tr id="' + i + '" class="rows" style="color : green">' + first + last + email + role + status + '</tr>');
    } else {
      status = '<td class="list status">' + 'disabled' + '</td>';
      $('#userListBody').append('<tr id="' + i + '" class="rows" style="color : red">' + first + last + email + role + status + '</tr>');
    }
    $('tr#' + i).addClass('clickable');
    $('tr#' + i).click(function() {
      buildUser(user);
    });
    i += 1;
  });
};

function buildUser(user) {
  $('#first').val(user.name.first);
  $('#last').val(user.name.last);
  $('#email').val(user.email);
  if(user.role === "USER") {
    $('#'+'role-admin').prop('checked',false);
    $('#'+'role-user').prop('checked',true);
  } else if(user.role === "ADMIN") {
    $('#'+'role-user').prop('checked',false);
    $('#role-admin').prop('checked',true);
  }
  if(user.enabled === "true") {
    $('#disabled').prop('checked',false);
    $('#enabled').prop('checked',true);
  } else if(user.enabled === "false") {
    $('#enabled').prop('checked',false);
    $('#disabled').prop('checked',true);
  }
  $('#update').unbind('click').click(function() {
    updateUser(user);
  });
  $(".status").prop('disabled',false);
  if(state.user.id === user.id) {
    $(".status").prop('disabled',true);
  }
  $('#userView').show();
  $('#userList').slideUp();
};

function updateUser(user) {
  const first = $('#first').val();
  const last = $('#last').val();
  const email = $('#email').val();
  const role = $('.role:checked').val();
  const status = $('.status:checked').val();

  if(first != user.name.first || last != user.name.last || email != user.email || role != user.role || status != user.enabled) {
    var mailRegex = /^([a-zA-Z0-9]+(([._-]?[a-zA-Z0-9]+)?)+)+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/igm;
    
    if(!mailRegex.test(email)) {
      alert("Invalid email!");
      return;
    }

    const update = {
      'email': email,
      'name': {
        'first': first,
        'last': last 
      },
      'role': role,
      'enabled': status
    };
    userUpdate(user.id, update);
  } else {
    // No info changed! Nothing/No update will happen.
  }
};

function newUser() {
  $('#newUserView').show();
  $('#userList').slideUp();
};

function addUser() {
  const first = $('#newFirst').val();
  const last = $('#newLast').val();
  const email = $('#newEmail').val();
  const password = $('#newPassword').val();
  const role = $('.newRole:checked').val();
  const status = $('.newStatus:checked').val();
  var mailRegex = /^([a-zA-Z0-9]+(([._-]?[a-zA-Z0-9]+)?)+)+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/igm;
  var passRegex = /^(?=.*\d)[A-Za-z\d]{3,}$/g;

  $('#newFirst').val("");
  $('#newLast').val("");
  $('#newEmail').val("");
  $('#newPassword').val("");
  $('.newRole').prop('checked', false);
  $('.newStatus').prop('checked', false);

  if(first === "" || last === "" || email === "" || password === "" || role === undefined || status === undefined) {
    alert("All input fields are required");
    return;
  }

  if(!mailRegex.test(email) || !passRegex.test(password)) {
    alert("Invalid username or password!");
    return;
  }

  const newUser = {
    'email' : email,
    'password' : password,
    'name' : {
      'first' : first,
      'last' : last
    } ,
    'defaults' : null,
    'role' : role,
    'enabled' : status
  };

  userAdd(newUser);
};

function cancel() {
  $('#newFirst').val("");
  $('#newLast').val("");
  $('#newEmail').val("");
  $('#newPassword').val("");
  $('.newRole').prop('checked', false);
  $('.newStatus').prop('checked', false);
  $('#userList').slideDown();
  $('#userView').slideUp();
  $('#newUserView').slideUp();
};

function errorHandler(err) {
  if (err.responseText === 'guessed already') {
    alert("Character already guessed.");
  } else if (err.responseText === 'Expired') {
    $('body').css('background-image', 'url("/images/letterRain.gif")');
    $('#gameView').hide();
    $('#home').hide();
    $('#login').show();
    alert('Session Expired!');
    state.user = null;
    state.token = null;
  } else if (err.responseText === 'Invalid') {
    alert('Invalid user name or password!');
  } else if (err.responseText === 'Disabled') {
    alert("User Disabled!");
  } else {
    console.log(err.responseText);
  }
};


/************************************** AJAX  *****************************/
function getMetadata() {
  $.ajax({
    url: '/wordgame/api/v3/metadata',
    method: 'GET',
    headers : {
      'token' : state.token
    },
    success: makeMetadata,
    error: errorHandler
  });
};

function getFont() {
  $.ajax({
    url: '/wordgame/api/v3/meta/fonts',
    method: 'GET',
    headers : {
      'token' : state.token
    },
    success: updateFont
  });
};

function getLogin(username, password) {
  $.ajax ({
    url: '/wordgame/api/v3/login',
    data :  { "username" : username, "password" : password },
    method : 'POST',
    success : function(data, status, request) {
      state.user = data;
      state.token = request.getResponseHeader('token');
      var username = state.user.name.first;
      if(data.role === "USER") {
        $(".username").text("");
        $(".username").text("Hello " + username + "!");
        getGames(state.user.id);
        getMetadata();
        $('#login').hide();
        $('body').css('background-image', 'url("/images/lettersBackground.jpg")');
        $('#home').show();
      } else if (data.role === "ADMIN"){
        $(".username").text("");
        $(".username").text("Hello " + username + "!");
        getUsers();
        $('body').css('background-image', 'url("/images/admin.png")');
        $('#login').hide();
        $('#userList').show();
      }
    },
    error: errorHandler
  });
}

function logout(evt) {
   $.ajax( {
      url : '/wordgame/api/v3/logout',
      method : 'POST',
      success : () => {
        state.user = null;
        state.token = null;
        $('body').css('background-image', 'url("/images/letterRain.gif")');
        $('#userList').hide();
        $('#gameView').hide();
        $('#home').hide();
        $('#login').show();
        $('#tableHead').nextAll().remove();
      }
   } );
}

function updateDefaults(defaults) {
  $.ajax({
    url: '/wordgame/api/v3/' + state.user.id + '/defaults',
    method: 'PUT',
    headers : {
      'token' : state.token
    },
    data: JSON.stringify(defaults),
    contentType: "application/json",
    success : function(result) {
      state.user.defaults = defaults;
    },
    error: errorHandler
  });
};

function userUpdate(userID, update) {
  $.ajax({
    url: '/wordgame/api/v3/admins/' + userID,
    method: 'PUT',
    headers : {
      'token' : state.token
    },
    data: JSON.stringify(update),
    contentType: "application/json",
    success : function(result) {
      getUsers();
      cancel();
    },
    error: errorHandler
  });
};

function userAdd(newUser) {
  $.ajax({
    url: '/wordgame/api/v3/admins/user',
    method: 'POST',
    headers : {
      'token' : state.token
    },
    data: JSON.stringify(newUser),
    contentType: "application/json",
    success : function(result) {
      getUsers();
      cancel();
    },
    error: errorHandler
  });
};

function createGame(font, level, colors) {
  $.ajax({
    url: '/wordgame/api/v3/' + state.user.id + "?level=" + level,
    method: 'POST',
    headers: {
      'x-font': font,
      'token' : state.token
    },
    data: colors,
    success: buildGame
  });
};

function makeGuess(uid, gid, guess) {
  $.ajax({
    url: '/wordgame/api/v3/' + uid + "/" + gid + '?guess=' + guess,
    method: 'PUT',
    headers : {
      'token' : state.token
    },
    success: buildGame,
    error: errorHandler
  });
};

function getGames(userID) {
  $.ajax({
    url: '/wordgame/api/v3/' + userID,
    method: 'GET',
    headers : {
      'token' : state.token
    },
    success: buildTable,
    error: errorHandler
  });
};

function getGame(uid, gid) {
  $.ajax({
    url: '/wordgame/api/v3/' + uid + '/' + gid,
    method: 'GET',
    headers : {
      'token' : state.token
    },
    success: buildGame,
    error: errorHandler
  });
};

function getUsers() {
  $.ajax({
    url: '/wordgame/api/v3/admins/users',
    method: 'GET',
    headers : {
      'token' : state.token
    },
    success: buildUsersTable,
    error: errorHandler
  });
};