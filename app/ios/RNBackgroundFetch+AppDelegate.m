//
//  RNBackgroundGeolocation+AppDelegate.m
//  RNBackgroundGeolocationSample
//
//  Created by Christopher Scott on 2016-08-01.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AppDelegate.h"
#import <TSBackgroundFetch/TSBackgroundFetch.h>
#import <objc/runtime.h>

@implementation AppDelegate(AppDelegate)

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
    NSLog(@"RNBackgroundFetch AppDelegate received fetch event");
    TSBackgroundFetch *fetchManager = [TSBackgroundFetch sharedInstance];
    [fetchManager performFetchWithCompletionHandler:completionHandler applicationState:application.applicationState];
}

@end

// Guard against duplicate BGTaskScheduler registrations by TSBGTask.
// Crash observed:
//   'Launch handler for task with identifier com.transistorsoft has already been registered'
// thrown when BGTaskScheduler is asked to register the same identifier multiple times.
// We swizzle +[TSBGTask registerForTaskWithIdentifier:] to:
// - log each registration attempt
// - ignore subsequent attempts for the same identifier instead of crashing.

@interface TSBGTask : NSObject
+ (void)registerForTaskWithIdentifier:(NSString *)identifier;
@end

@implementation TSBGTask (ASGuard)

+ (void)load
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class cls = object_getClass((id)self);
        SEL originalSelector = @selector(registerForTaskWithIdentifier:);
        SEL swizzledSelector = @selector(as_registerForTaskWithIdentifier:);

        Method originalMethod = class_getClassMethod(cls, originalSelector);
        Method swizzledMethod = class_getClassMethod(cls, swizzledSelector);

        if (originalMethod && swizzledMethod) {
            method_exchangeImplementations(originalMethod, swizzledMethod);
            NSLog(@"[TSBGTask+ASGuard] Swizzled +registerForTaskWithIdentifier:");
        } else {
            NSLog(@"[TSBGTask+ASGuard] Failed to swizzle +registerForTaskWithIdentifier: (original=%p, swizzled=%p)", originalMethod, swizzledMethod);
        }
    });
}

+ (void)as_registerForTaskWithIdentifier:(NSString *)identifier
{
    static NSMutableSet<NSString *> *as_registeredTaskIdentifiers;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        as_registeredTaskIdentifiers = [NSMutableSet set];
    });

    if ([as_registeredTaskIdentifiers containsObject:identifier]) {
        NSLog(@"[TSBGTask+ASGuard] Skipping duplicate BGTaskScheduler registration for identifier '%@'", identifier);
        return;
    }

    NSLog(@"[TSBGTask+ASGuard] Registering BGTask identifier '%@'", identifier);
    [as_registeredTaskIdentifiers addObject:identifier];

    // Call original implementation (now swizzled).
    [self as_registerForTaskWithIdentifier:identifier];
}

@end
