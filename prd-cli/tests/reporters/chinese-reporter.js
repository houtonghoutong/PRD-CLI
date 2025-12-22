/**
 * Jest 中文报告器
 */
class ChineseReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
    }

    onRunStart() {
        console.log('\n🧪 开始运行测试...\n');
    }

    onTestResult(test, testResult, aggregatedResult) {
        const { testResults, testFilePath } = testResult;
        const fileName = testFilePath.split('/').pop();

        if (testResult.numFailingTests === 0) {
            console.log(`✅ ${fileName}`);
        } else {
            console.log(`❌ ${fileName}`);

            // 显示失败的测试
            testResults.forEach(result => {
                if (result.status === 'failed') {
                    console.log(`   ❌ ${result.ancestorTitles.join(' › ')} › ${result.title}`);
                    if (result.failureMessages && result.failureMessages.length > 0) {
                        result.failureMessages.forEach(msg => {
                            console.log(`      ${msg.split('\n')[0]}`);
                        });
                    }
                }
            });
        }
    }

    onRunComplete(contexts, results) {
        const {
            numFailedTests,
            numPassedTests,
            numPendingTests,
            numTotalTests,
            numFailedTestSuites,
            numPassedTestSuites,
            numTotalTestSuites,
            startTime,
            snapshot
        } = results;

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 测试结果汇总');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 测试套件统计
        console.log('📁 测试套件:');
        if (numFailedTestSuites > 0) {
            console.log(`   ❌ 失败: ${numFailedTestSuites}`);
        }
        console.log(`   ✅ 通过: ${numPassedTestSuites}`);
        console.log(`   📊 总计: ${numTotalTestSuites}\n`);

        // 测试用例统计
        console.log('🧪 测试用例:');
        if (numFailedTests > 0) {
            console.log(`   ❌ 失败: ${numFailedTests}`);
        }
        if (numPendingTests > 0) {
            console.log(`   ⏭️  跳过: ${numPendingTests}`);
        }
        console.log(`   ✅ 通过: ${numPassedTests}`);
        console.log(`   📊 总计: ${numTotalTests}\n`);

        // 快照统计
        if (snapshot.total > 0) {
            console.log('📸 快照测试:');
            if (snapshot.added > 0) {
                console.log(`   ➕ 新增: ${snapshot.added}`);
            }
            if (snapshot.updated > 0) {
                console.log(`   🔄 更新: ${snapshot.updated}`);
            }
            if (snapshot.unmatched > 0) {
                console.log(`   ❌ 不匹配: ${snapshot.unmatched}`);
            }
            if (snapshot.matched > 0) {
                console.log(`   ✅ 匹配: ${snapshot.matched}`);
            }
            console.log(`   📊 总计: ${snapshot.total}\n`);
        }

        // 耗时
        console.log(`⏱️  总耗时: ${duration} 秒\n`);

        // 最终结果
        if (numFailedTests === 0 && numFailedTestSuites === 0) {
            console.log('🎉 所有测试通过！\n');
        } else {
            console.log('❌ 有测试失败，请检查上述错误信息。\n');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

module.exports = ChineseReporter;
