
import Services from "./Services/Services";
import { useState, useEffect } from "my-react";
import { MenuState } from "./globalType";

class UserInterface {
    private setMenuState: (state: MenuState) => void;
    private menuState: MenuState = "pongMenu";

    constructor(menuState : MenuState, setMenuState: (state: MenuState) => void) {
        this.menuState = menuState;
        this.setMenuState = setMenuState;
        Services.EventBus!.on("UI:MenuStateChange", this.onMenuStateChange);
    }

    public update() : void {
        if (this.menuState === "local") {
            Services.GameService!.launchGame("PongLocal");
            Services.GameService!.startGame();
        }
        else if (this.menuState === "online") {
            //this.setMenuState("pongMenu");
            Services.GameService!.launchGame("PongOnline");
            Services.GameService!.startGame();
        }
    }

    public showMainMenu() : void {
        this.setMenuState("pongMenu");
    }

    private onMenuStateChange = (payload: MenuState) : void  => {
        this.setMenuState(payload);
    }

    public dispose() : void {
        Services.EventBus!.off("UI:MenuStateChange", this.onMenuStateChange);
    }
}

export default UserInterface;