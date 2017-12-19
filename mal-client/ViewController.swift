//
//  ViewController.swift
//  mal-client
//
//

import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {

    @IBOutlet weak var webContainerView: UIView!
    @IBOutlet weak var progressView: UIProgressView!
    @IBOutlet weak var backButton: UIBarButtonItem!

    private var webView: WKWebView!

    // https://stackoverflow.com/questions/46591637/in-swift-4-how-do-i-remove-a-block-based-kvo-observer
    private var observations: [NSKeyValueObservation] = []

    @IBAction func onGoBack(_ sender: UIBarButtonItem) {
        webView.goBack()
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        setupWebView()
        setupProgressView()
        setupToolbar()

        let url = URL(string: "https://myanimelist.net")!
        let request = URLRequest(url: url)
        webView.load(request)
    }

    /// Web に渡す設定を含む JS コードを取得する
    private func createWebConfigJS() -> String {
        let jsPath = Bundle.main.path(forResource: "config", ofType: "js")!
        return try! String(contentsOfFile: jsPath)
    }

    private func setupWebView() {
        let userContentController = WKUserContentController()
        let jsPath = Bundle.main.path(forResource: "bundle", ofType: "js")!
        let jsSource = try! String(contentsOfFile: jsPath)
        userContentController.addUserScript(WKUserScript(
                source: jsSource,
                injectionTime: WKUserScriptInjectionTime.atDocumentEnd,
                forMainFrameOnly: true))

        userContentController.addUserScript(WKUserScript(
                source: createWebConfigJS(),
                injectionTime: WKUserScriptInjectionTime.atDocumentStart,
                forMainFrameOnly: true))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = userContentController

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.allowsBackForwardNavigationGestures = true

        webContainerView.addSubview(webView)
        webView.topAnchor.constraint(equalTo: webContainerView.topAnchor, constant: 0.0).isActive = true
        webView.bottomAnchor.constraint(equalTo: webContainerView.bottomAnchor, constant: 0.0).isActive = true
        webView.leadingAnchor.constraint(equalTo: webContainerView.leadingAnchor, constant: 0.0).isActive = true
        webView.trailingAnchor.constraint(equalTo: webContainerView.trailingAnchor, constant: 0.0).isActive = true
    }

    private func setupProgressView() {
        observations.append(webView.observe(\.loading) { _, _ in
            if self.webView.isLoading {
                self.progressView.isHidden = false
            } else {
                self.progressView.isHidden = true
                self.progressView.setProgress(0.0, animated: false)
            }
        })
        observations.append(webView.observe(\.estimatedProgress) { _, _ in
            self.progressView.setProgress(Float(self.webView.estimatedProgress), animated: true)
        })
    }

    private func setupToolbar() {
        observations.append(webView.observe(\.canGoBack, options: [.new, .initial]) { v, _ in
            self.backButton.isEnabled = self.webView.canGoBack
        })
    }

    /// Web のロード完了後
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        addStyles()
    }

    private func addStyles() {
        let cssPath = Bundle.main.path(forResource: "styles", ofType: "css")!
        let cssString = try! String(contentsOfFile: cssPath)
        let jsString = "var style = document.createElement('style'); style.innerHTML = `\(cssString)`; document.head.appendChild(style);"
        webView.evaluateJavaScript(jsString)
    }
}
