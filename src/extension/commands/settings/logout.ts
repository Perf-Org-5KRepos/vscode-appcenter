import { CommandParams, Profile, ProfileQuickPickItem } from '../../../helpers/interfaces';
import { AuthProvider } from '../../resources/constants';
import { Strings } from '../../resources/strings';
import { Command } from '../command';
import { VsCodeUI } from '../../ui/vscodeUI';

export default class Logout extends Command {

    constructor(params: CommandParams) {
        super(params);
    }

    public async runNoClient(): Promise<boolean | void> {
        if (!await super.runNoClient()) {
            return false;
        }

        // Get profiles in which user is logged in
        const profiles: Profile[] = await this.appCenterAuth.getProfiles();

        // No profiles - exit
        if (profiles.length === 0) {
            return true;
        }

        // One profile - log out from it
        if (profiles.length === 1) {
            return await this.logoutUser(profiles[0]);
        }

        // Two or more users - choose from which one user should be logged out
        const menuOptions: ProfileQuickPickItem[] = [];
        profiles.forEach(profile => {
            menuOptions.push(<ProfileQuickPickItem>{
                label: profile.userName,
                description: "",
                profile: profile
            });
        });
        try {
            const selected: ProfileQuickPickItem = await VsCodeUI.showQuickPick(menuOptions, Strings.SelectProfileTitlePlaceholder);
            if (!selected) {
                // User cancel selection
                return void 0;
            }
            return this.logoutUser(selected.profile);
        } catch (error) {
            this.handleError(error);
        }
    }

    private async logoutUser(profile: Profile): Promise<boolean> {
        try {
            await this.appCenterAuth.doLogout(profile.userId);
            VsCodeUI.ShowInfoMessage(Strings.UserLoggedOutMsg(AuthProvider.AppCenter, profile.userName));
            await this.manager.setupAppCenterStatusBar(this.appCenterAuth.activeProfile);
            return true;
        } catch (e) {
            this.handleError(e);
            return false;
        }
    }

    private handleError(error: Error) {
        VsCodeUI.ShowErrorMessage("Error occured during the logout.");
        this.logger.error(error.message, error, true);
    }
}