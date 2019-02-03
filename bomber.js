var IDE_HOOK = false;
var VERSION = '2.6.2';
//This games plays best 800*600 pixels. Window scales with browser size so need to adjust screen size.
////Could simple set SCREEN_WIDTH=600, SCREEN_HEIGHT=800
//See folowing article on scaling html5 games
//https://www.joshmorony.com/how-to-scale-a-game-for-all-device-sizes-in-phaser/
var SCREEN_WIDTH = window.innerWidth * window.devicePixelRatio;
var SCREEN_HEIGHT = window.innerHeight * window.devicePixelRatio;

var game = new Phaser.Game(SCREEN_WIDTH, SCREEN_HEIGHT, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('player', 'assets/Fokker_default.png');
    game.load.image('star', 'assets/star2.png');
    game.load.image('bomb', 'assets/Bomb.png');
    game.load.image('block', 'assets/SkyScraperBlock.png');
    game.load.image('top', 'assets/SkyScraperTop.png');
    //Explosions are 32x32 and there are 16 frames
    game.load.spritesheet('explode', 'assets/explode.png', EXPLODE_DX, EXPLODE_DY, 16);
    storeys = game.add.group();
    initVariables();

}
//All times in seconds. All distances in pixels
var COLOR = "#ff0044"; //RED
var RED_12_ARIAL = { font: "12px Arial",fill: COLOR,align: "center"};
var RED_65_ARIAL = { font: "65px Arial",fill: COLOR,align: "center"};
var DURATION_BETWEEN_BULLETS = 2;
var EXPLODE_DX = 64;
var EXPLODE_DY = 64;
var PLAYER_REFRESH_TIME = 0.016667; //60Hz
var BOMB_REFRESH_TIME = 0.016667; //60Hz
var playerVelocity = 100.0; //100 pixels/sec
var bombVelocity = 200.0; //100 pixels/sec
var playerDx = playerVelocity * PLAYER_REFRESH_TIME;
var playerDy = 30.0; //This is height of each tower block
var blockHeight=0;
var blockWidth=0;
var topHeight=0;
var maxBuildingHeight=0;
var maxBuildings=0
var gameover=false;
var bombDy = bombVelocity * BOMB_REFRESH_TIME;
var stars;
var storeys;
var bombs;
var player;

var fireButton;
var enterButton;
var loaded=true;
var frameTime = 0;
var scoreText;
var score=0;
var levelText;
var level=1;
var storey=0;
function create () {

    storey = 0;
    initGameArea();
    stars = game.add.group();

    for (var i = 0; i < 128; i++)
    {
        stars.create(game.world.randomX, game.world.randomY, 'star');
    }

    //buildCity(19, 450, 'block', 'top');
    bombs = game.add.group();
    //Set initial position of player to be 32,32
    player = game.add.sprite(0, 0, 'player');
    maxBuildingHeight=SCREEN_HEIGHT-player.height;

    buildCity(getNumberBuildings(), getHeighestBuildingHeight(), 'block', 'top');
    //Set size of player to 1/3. (Actually don't need to do this . Resized in gimp) player.scale.setTo(0.333,0.333);
    //player.anchor.x = 0.5;

    game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1);


    //Use function 'loop' to loop indefinitely, 'add' to add oneoff event and repeat for
    //a callback that is called x number of times
    game.time.events.loop(Phaser.Timer.SECOND * PLAYER_REFRESH_TIME, movePlayer, this);
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    enterButton = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);


    levelText = game.add.text(10, 10, "LEVEL " + level, RED_12_ARIAL);
    scoreText = game.add.text(10, 30, "SCORE: " + score, RED_12_ARIAL);


}
function initGameArea(){
    //Set bounds same size as game canvas
    game.world.setBounds(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    //https://phaser.io/docs/2.6.2/Phaser.Graphics.html#drawRect
    var graphics = game.add.graphics(0, 0);
    graphics.lineStyle(2, 0xff0044, 1);
    //graphics.beginFill(0xff0000);
    graphics.drawRect(1, 1, SCREEN_WIDTH-2, SCREEN_HEIGHT-2);
    //graphics.endFill();
    //window.graphics=graphics;
}
function initVariables(){
    var block = storeys.create(2*SCREEN_HEIGHT, 2*SCREEN_WIDTH, 'block');
    var top = storeys.create(2*SCREEN_HEIGHT, 2*SCREEN_WIDTH, 'top');
    blockHeight=block.height;
    blockWidth=block.width;
    topHeight=top.height;
    maxBuildings=SCREEN_WIDTH/blockWidth;

    //Now we have size, delete temp images
    block.kill();
    top.kill();
}
function getGameAccelerateFactor(){
    var factor = 1;
    var levelAtWhichSpeedUpOccurs = 4;
    if (level > levelAtWhichSpeedUpOccurs){
        factor = level/levelAtWhichSpeedUpOccurs;
        console.log("Delta factor is " + factor)
    }
    return factor;
}
function getNumberBuildings(){
    var MIN_BUILDINGS = 4 ;
    //Get an array of 10 numbers between 10 and maxBuildings
    var numbers=getArray(10,10, maxBuildings);
    //The level reflects the index into this array of buildings. IE Higher level more buildings
    //unless level greater than 10 then just return maxBuildings
    var index=level >= 10 ? 9 :level-1;
    //For level 1 we get 0 buildings this is stupid, get at least 4
    return numbers[index] > MIN_BUILDINGS ? numbers[index]: MIN_BUILDINGS;
}
function getHeighestBuildingHeight(){
    var MIN_HEIGHT = 2 *blockHeight;
    //Get an array of 10 numbers between MIN_HEIGHT and maxBuildingHeight
    var numbers=getArray(10,MIN_HEIGHT, maxBuildingHeight);
    //The level reflects the index into this array of buildings. IE Higher level  higher buildings
    //unless level greater than 10 then just return maxBuildings
    var index=level >= 10 ? 9 :level-1;
    //For level 1 we get 0 building height this is stupid, get at least 2 blocks
    return numbers[index] > MIN_HEIGHT ? numbers[index]: MIN_HEIGHT;
}
function buildCity(numberBuildings, heighestBuildingHeight, blockPiece, blockTop){
     var distanceBetweenBuildings=SCREEN_WIDTH/numberBuildings;
     //Validate city sise
     if(numberBuildings*blockWidth < SCREEN_WIDTH){
        if(heighestBuildingHeight>=(topHeight+blockHeight)){
           console.log("Building city.....");
        }else{
            console.log("Cannot build city. Heighest building smaller than height of one block + top block");
            return;
        }
     }else{
         console.log("Cannot build city. Too many buildings");
         return;
     }
    //Now build left to right, bottom block to top block. Build highest tower first then gradually smaller
    var currentX=0;
    var currentY=SCREEN_HEIGHT-blockHeight;
    var maxNumberAdditionalBlocks = (heighestBuildingHeight-blockHeight-topHeight)/blockHeight;
    var arrayAdditionalBlockCounts = getShuffledArray(numberBuildings, maxNumberAdditionalBlocks);
    for (var i = 0; i < numberBuildings; i++){
        //Add bottom of tower
        addStorey(currentX, currentY, blockPiece);
        for (var j = 0; j < arrayAdditionalBlockCounts[i]; j++){
            currentY-=blockHeight;
            addStorey(currentX, currentY, blockPiece);
        }
        //Add top of tower
        currentY-=topHeight;
        addStorey(currentX, currentY, blockTop);
        //Move to next tower so move to bottom block of next tower
        currentX += distanceBetweenBuildings;
        currentY=SCREEN_HEIGHT-blockHeight;
    }
}
function addStorey(currentX, currentY, block){
    storeys.create(currentX, currentY, block);
    storey+=1;
}
function getArray(arraySize, minValue,maxValue){
    var array=[];
    var increment=(maxValue-minValue)/arraySize;
    for (var i = minValue; i < maxValue; i+=increment) {
       array.push(Math.round(i));
    }
    return array;
}
function getShuffledArray(arraySize, maxValue){
    var array = getArray(arraySize, 0, maxValue);
    shuffleArray(array);
    return array;
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
function checkBombHitsTower() {

    //can use physics overlap but here we just do simple overlpa check
    bombs.forEachAlive(function(bomb){
                           storeys.forEachAlive(function(storeyOfBuilding){
                                   var boundsA = bomb.getBounds();
                                   var boundsB = storeyOfBuilding.getBounds();
                                   if(Phaser.Rectangle.intersects(boundsA, boundsB)){
                                       generalExplode(storeyOfBuilding,50);
                                       //Kill sprites so this callback not called again
                                       //bomb.kill();
                                       storeyOfBuilding.kill();
                                       score+=1;
                                       storey-=1;
                                       scoreText.setText("SCORE: " + score);
                                   }
                           });
                       });

}
function checkPlayerHitsTower() {

    //can use physics overlap but here we just do simple overlpa check

    storeys.forEachAlive(function(baddy){
            var boundsA = player.getBounds();
            var boundsB = baddy.getBounds();
            if(Phaser.Rectangle.intersects(boundsA, boundsB)){
                generalExplode(player, 5);
                player.kill();
                gameover=true;
                var gameoverText = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER", RED_65_ARIAL);
                gameoverText.anchor.setTo(0.5, 0.5);
            }
    });


}
function generalExplode(sprite, speed){
    //Centre explosion over centre of sprite
    var positionX = sprite.position.x + sprite.width/2.0 - EXPLODE_DX/2.0;
    var positionY = sprite.position.y + sprite.height/2.0 - EXPLODE_DY/2.0;
    explosion = game.add.sprite(positionX, positionY, 'explode');
    explosion.animations.add('explosion');
    explosion.animations.play('explosion', speed, false,true);

}
function movePlayer () {
    if(!gameover){
        if(player.x > SCREEN_WIDTH){
            player.x = 0;
            player.y +=playerDy;
        }else{
            player.x += playerDx*getGameAccelerateFactor();
        }
  }

}
function update () {
    bombs.forEachAlive(updateBullets, this);
    checkBombHitsTower();

    if(!gameover){
        if(storey<=0){
            //Demolished all towers
            increaseComplexity();
        } else if (fireButton.isDown){
            fireBullet();
        }
        checkPlayerHitsTower();
    }
    else{
        if (enterButton.isDown){
           restart();
        }
    }
}
function restart(){
   loaded =true;
   gameover=false;
   score = 0;
   level = 1;
   this.game.state.restart();
}
function increaseComplexity(){
   loaded =true;
   level += 1;
   this.game.state.restart();
}
function updateBullets (bomb) {

     if (game.time.now > bomb.nextMoveTime){
        bomb.y += bombDy*getGameAccelerateFactor();
        if (bomb.y > SCREEN_HEIGHT)
        {
            bomb.kill();
            loaded=true;
        }
         updateBombMoveTime(bomb);
     }
}
function updateBombMoveTime(bomb){
    bomb.nextMoveTime = game.time.now + BOMB_REFRESH_TIME;
}
function fireBullet () {

    if (loaded)
    {
        //https://phaser.io/docs/2.6.2/Phaser.Group.html#getFirstAlive
        //True means create a new bomb item, then position and then image
        var bomb = bombs.getFirstDead(true, player.position.x , player.position.y + player.texture.height/2, 'bomb');
        updateBombMoveTime(bomb);
        loaded=false;
    }

}



