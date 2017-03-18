import frameModule = require("ui/frame");


export function navigateTo(pageName: string, params?: string) {
    const topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/' + pageName + '/' + pageName,
        context: {
            chatName: params
        }
    });
}

export function navigateBack() {
    const topFrameModule = frameModule.topmost();
    topFrameModule.goBack();
}