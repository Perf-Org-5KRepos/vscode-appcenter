import * as vscode from "vscode";
import { AppCenteAppType, CommandNames } from "../../constants";
import { CommandParams, CurrentApp, QuickPickAppItem } from "../../helpers/interfaces";
import { MenuHelper } from "../../helpers/menuHelper";
import { Utils } from "../../helpers/utils";
import { CustomQuickPickItem } from "../../helpers/vsCodeUtils";
import { Strings } from "../../strings";
import { models } from "../apis";
import { ReactNativeAppCommand } from "./reactNativeAppCommand";

export default class AppCenterPortalMenu extends ReactNativeAppCommand {
    private appName: string;
    private ownerName: string;
    private isOrg: boolean;

    constructor(params: CommandParams) {
        super(params);
    }

    public async run(): Promise<void> {

        // Disabling the check whether project has react-native package installed cause it's kinda useless here.
        this.checkForReact = false;
        if (!await super.run()) {
            return;
        }
        this.showAppsQuickPick(this.CachedApps, true);
        this.refreshCachedAppsAndRepaintQuickPickIfNeeded(true);
    }

    protected async handleShowCurrentAppQuickPickSelection(selected: QuickPickAppItem, rnApps: models.AppResponse[]) {
        if (selected.target === CommandNames.CreateApp.CommandName) {
            return this.showCreateAppOptions();
        } else {

            let selectedApp: models.AppResponse;

            const selectedApps: models.AppResponse[] = rnApps.filter(app => app.name === selected.target && app.owner.type === selected.description);

            // If this is not current app then we can assign current app, otherwise we will use GetCurrentApp method
            if (selected.target !== this.currentAppMenuTarget) {
                if (!selectedApps || selectedApps.length !== 1) {
                    return;
                }
                selectedApp = selectedApps[0];
            }

            if (selectedApp) {
                this.isOrg = selectedApp.owner.type.toLowerCase() === AppCenteAppType.Org.toLowerCase();
                this.appName = selectedApp.name;
                this.ownerName = selectedApp.owner.name;
            } else {
                const currentApp: CurrentApp | null = await this.getCurrentApp();
                if (currentApp) {
                    this.isOrg = currentApp.type.toLowerCase() === AppCenteAppType.Org.toLowerCase();
                    this.appName = currentApp.appName;
                    this.ownerName = currentApp.ownerName;
                } else {
                    this.logger.error("Current app is undefiend");
                    throw new Error("Current app is undefiend");
                }
            }
            this.showAppCenterPortalMenuQuickPick(MenuHelper.getAppCenterPortalMenuItems(Utils.isReactNativeProject(this.logger, this.rootPath, false)));
        }
    }

    private async showAppCenterPortalMenuQuickPick(appCenterMenuOptions: CustomQuickPickItem[]): Promise<void> {
        return vscode.window.showQuickPick(appCenterMenuOptions, { placeHolder: Strings.MenuTitlePlaceholder })
            .then(async (selected: QuickPickAppItem) => {
                if (!selected) {
                    this.logger.info('Canceled selection of current App Center tabs');
                    return;
                }
                MenuHelper.handleMenuPortalQuickPickSelection(this._params, selected.target, this.ownerName, this.appName, this.isOrg);
            });
    }
}
