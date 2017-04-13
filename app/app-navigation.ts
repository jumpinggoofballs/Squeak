import frameModule = require("ui/frame");


export function navigateTo(pageName: string, params?: string) {
    const topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/' + pageName + '/' + pageName,
        context: {
            chatRef: params
        }
    });
}

export function navigateBack() {
    // const topFrameModule = frameModule.topmost();
    // topFrameModule.goBack();

    // for the time being, this is all that is necessary and works better
    initNavigation();
}

export function initNavigation() {
    const topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/main-page/main-page',
        clearHistory: true
    });
}