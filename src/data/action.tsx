
export abstract class WerewolfRoleAction {
    abstract nightAction<Params>(params: Params): any;
}

export abstract class VillagerRoleAction {
    abstract onDies<Params>(params: Params): any;
    abstract nightBeforeWerewolves<Params>(params: Params): any;
    abstract nightAfterWerewolves<Params>(params: Params): any;
}