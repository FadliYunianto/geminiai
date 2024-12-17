const { exec } = require('child_process');
const robot = require('robotjs');

const typingSpeed = 50; //Kecepatan mengetik default

async function jalankansemua(functionCall) {
  const { name, args } = functionCall;

  switch (name) {
      case "control_mouse_cursor":
            return controlMouse(args);
      case "type_text":
          return typeText(args);
      case "delete_selected_text":
          return deleteSelectedText();
       case "select_text":
          return selectText(args);
        case "keyboard_shortcut":
            return keyboardShortcut(args);
      default:
          return `Function ${name} not found`;
    }
}
async function controlMouse(args) {
    const { action, x, y, button, scroll_amount } = args;
        if (!x || !y) {
        //  throw new Error("Koordinat x dan y tidak boleh kosong saat menggunakan `click`, `double_click` atau `move`");
        }
      switch(action) {
        case "click":
          robot.moveMouse(x, y);
          robot.mouseClick(button || 'left', false);
          break;
        case "double_click":
          robot.moveMouse(x, y);
          robot.mouseClick(button || 'left', true);
          break;
        case "right_click":
          robot.moveMouse(x, y);
          robot.mouseClick('right', false);
          break;
          case "move":
             robot.moveMouse(x,y);
            break;
        case "drag":
            break;
        case "scroll":
              if(scroll_amount) {
               robot.scrollMouse(0, scroll_amount)
               }
          break;
        default:
           throw new Error("Action not found");
      }

}

async function typeText(args) {
    const { text, typingSpeed } = args;
    for (const char of text) {
        robot.typeString(char);
       await delay(typingSpeed || globalThis.typingSpeed);
    }
}
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function selectText(args){
  const { modifierKey, keyToTap } = args
  robot.keyToggle(modifierKey, "down");
    robot.keyTap(keyToTap);
    robot.keyToggle(modifierKey, "up");
}
function deleteSelectedText(){
    robot.keyTap("delete");
}
async function keyboardShortcut(args) {
  const { modifierKey, keyToTap } = args;
   if(keyToTap === 'enter') {
        robot.keyTap(keyToTap)
   }else{
       robot.keyToggle(modifierKey, 'down');
       robot.keyTap(keyToTap);
       robot.keyToggle(modifierKey, 'up');
   }
}

module.exports = {jalankansemua}