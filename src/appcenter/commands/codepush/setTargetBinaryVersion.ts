import { validRange } from 'semver';
import * as vscode from 'vscode';
import { ExtensionManager } from '../../../extensionManager';
import { AppCenterOS, Constants } from '../../../helpers/constants';
import { CurrentApp } from '../../../helpers/interfaces';
import { Strings } from '../../../helpers/strings';
import { VsCodeUtils } from '../../../helpers/vsCodeUtils';
import { ILogger } from '../../../log/logHelper';
import { RNCPAppCommand } from './rncpAppCommand';

export default class SetTargetBinaryVersion extends RNCPAppCommand {
    constructor(manager: ExtensionManager, logger: ILogger) {
        super(manager, logger);
    }

    public async runNoClient(): Promise<void> {
        if (!await super.runNoClient()) {
            return;
        }
        vscode.window.showInputBox({ prompt: Strings.PleaseProvideTargetBinaryVersion, ignoreFocusOut: true })
            .then(appVersion => {
                if (!appVersion) {
                    // if user press esc do nothing then
                    return;
                }
                if (appVersion !== Constants.AppCenterDefaultTargetBinaryVersion && !validRange(appVersion)) {
                    VsCodeUtils.ShowWarningMessage(Strings.InvalidAppVersionParamMsg);
                    return;
                }
                return this.getCurrentApp().then((app: CurrentApp) => {
                    if (app) {
                        return this.saveCurrentApp(
                            app.identifier,
                            AppCenterOS[app.os], {
                                currentDeploymentName: app.currentAppDeployments.currentDeploymentName,
                                codePushDeployments: app.currentAppDeployments.codePushDeployments
                            },
                            appVersion,
                            app.type,
                            app.isMandatory
                        ).then(() => {
                            if (appVersion) {
                                VsCodeUtils.ShowInfoMessage(`Changed target binary version to '${appVersion}'`);
                            } else {
                                VsCodeUtils.ShowInfoMessage(`Changed target binary version to automatically fetched`);
                            }
                        });
                    } else {
                        VsCodeUtils.ShowInfoMessage(Strings.NoCurrentAppSetMsg);
                        return;
                    }
                });
            });
    }
}
