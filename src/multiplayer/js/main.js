import { Mod } from "shapez/mods/mod";
import { SOUNDS } from "shapez/platform/sound";
import { T } from "shapez/translations";
// @ts-ignore
import multiplayerPng from "../res/icons/multiplayer.png";

const multiplayerIcon = document.createElement('img');
multiplayerIcon.src = multiplayerPng;
multiplayerIcon.alt = 'MP';
multiplayerIcon.classList.add('multiplayerIcon');

/** @type {MultiplayerMod} */
let mod;

let hosting = false;
let multiplayer = false;

class MultiplayerMod extends Mod {
    init() {
        mod = this;
        // HTML
        this.signals.stateEntered.add((state) => {
            if (state.key === 'MainMenuState') {
                this.modifyMainMenu();
            }
        })
    }

    modifyMainMenu() {
        let multiplayerButton;
        let playButton;
        function generateMultiplayerButton() {
            multiplayerButton = document.createElement('button');
            mod.makePressable(multiplayerButton, false, false, mod.mpDialog);
            multiplayerButton.classList.add('multiplayerButton');
            multiplayerButton.appendChild(multiplayerIcon);
            if (document.getElementsByClassName('playButton').length > 0) {
                playButton = document.getElementsByClassName('playButton')[0];
                multiplayerButton.classList.add('play');
                multiplayerButton.classList.remove('continue');
            } else {
                playButton = document.getElementsByClassName('continueButton')[0];
                multiplayerButton.classList.add('continue');
                multiplayerButton.classList.remove('play');
            }
            mod.makePressable(playButton, true, true, 
                () => {
                    multiplayerButton.classList.add('shrink')
                }, 
                () => {
                    multiplayerButton.classList.remove('shrink')
                }
            );
            genneratMultiplayerButtonCss();
            playButton.parentElement.append(multiplayerButton);
        }
        function genneratMultiplayerButtonCss() {
            const left = playButton.clientWidth;
            mod.modInterface.registerCss(`
            #state_MainMenuState .mainContainer .buttons .multiplayerButton {
                left: calc(${left}px - (34px * var(--ui-scale)));
            }

            #state_MainMenuState .mainContainer .buttons .multiplayerButton:hover {
                left: calc(${left}px - (39px * var(--ui-scale)));
            }

            #state_MainMenuState .mainContainer .buttons .multiplayerButton.shrink {
                left: calc(${left*0.99}px - (34px * var(--ui-scale)));
            }
            `)
        }
        async function startObservers() {
            const mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        if (mutation.removedNodes.length > 0 && mutation.removedNodes[0] === playButton) {
                            generateMultiplayerButton();
                            resizeObserver.disconnect();
                            resizeObserver.observe(playButton);
                        }
                    }
                })
            });
            const resizeObserver = new ResizeObserver(resizes => {
                resizes.forEach(() => {
                    genneratMultiplayerButtonCss();
                })
            })
            mutationObserver.observe(playButton.parentElement, { childList: true });
            resizeObserver.observe(playButton);
        }
        generateMultiplayerButton();
        startObservers();
    }

    mpDialog() {
        const options = mod.dialogs.showInfo(T.multiplayer.mpGame.title, T.multiplayer.mpGame.desc, ["cancel:bad", "hostMp:good", "joinMp:good"]);
        options['hostMp'].add(mod.host);
        options['joinMp'].add(mod.join);
    }

    host() {
        hosting = true;
        multiplayer = true;
        console.log('host');
    }

    join() {
        hosting = true;
        console.log('join');
    }

    /** @returns {boolean} */
    static isHosting() {
        return hosting;
    }

    /** @returns {boolean} */
    static isMultiplayer() {
        return multiplayer;
    }
    /* 
    FMI: onRelease needs to be tolerant against wrong fires!
    */
    makePressable(button, pressEffect=true, overwriteDefaultFunction=false, onClick=null, onRelease=null) {
        const mod = this;
        if (!pressEffect) {
            button.classList.add('noPressEffect');
        }
        if (onClick) {
            button.addEventListener('mousedown', () => {onClick(mod)});
        }
        if (onRelease) {
            button.addEventListener('mouseout', () => {onRelease(mod)});
            button.addEventListener('mouseup', () => {onRelease(mod)})
        }
        if (!overwriteDefaultFunction) {
            button.addEventListener('mousedown', () => {
                button.classList.add('pressed');
                this.app.sound.playUiSound(SOUNDS.uiClick);
            });
            button.addEventListener('mouseout', () => {
                button.classList.remove('pressed');
            });
            button.addEventListener('mouseup', () => {
                button.classList.remove('pressed');
            })
        }
    }
}